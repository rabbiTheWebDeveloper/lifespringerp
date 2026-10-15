import { dbConnect } from "@/service/mongo";
import { ClassSessionModel } from "@/model/class-model";
import { CourseModel } from "@/model/course-model";

const DEFAULT_DURATION = 45;
const MIN_DURATION = 15;
const MAX_DURATION = 180;

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

async function ensureModels() {
  await dbConnect();
  await Promise.all([
    import("@/model/course-model"),
    import("@/model/student-model"),
  ]);
}

const POPULATE = [
  { path: "course",  select: "title courseId thumbnail level" },
  { path: "student", select: "fullName studentId avatar" },
];

/** Fetch classes for a teacher with high-performance DB-level filtering and pagination */
export async function getTeacherClasses(teacherId, options = {}) {
  try {
    await ensureModels();
    const {
      status,
      month,
      dayOfWeek,
      date,
      search,
      page = 1,
      limit = 10,
      all = false,
    } = options;

    const query = { teacher: teacherId };

    // Status filter
    if (status) {
      if (status === "in-progress") {
        query.status = { $in: ["in-progress", "paused"] };
      } else {
        query.status = status;
      }
    }

    // Bangladesh Time (UTC+6)
    const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
    const now = new Date();
    const bdNow = new Date(now.getTime() + BD_OFFSET_MS);

    // Month filter (BD Time)
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yr, mo] = month.split("-").map(Number);
      const start = new Date(Date.UTC(yr, mo - 1, 1, -6, 0, 0, 0));
      const end   = new Date(Date.UTC(yr, mo,     1, -6, 0, 0, 0));
      if (status === "completed" || status === "cancelled") {
        query.createdAt = { $gte: start, $lt: end };
      } else if (!status) {
        query.$or = [
          { status: { $in: ["scheduled", "in-progress", "paused"] } },
          { createdAt: { $gte: start, $lt: end } },
        ];
      }
      // If status is "scheduled" or "in-progress", active classes from any month remain visible
    }

    // Date filter (BD Time)
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [dy, dm, dd] = date.split("-").map(Number);
      const start = new Date(Date.UTC(dy, dm - 1, dd, -6, 0, 0, 0));
      const end   = new Date(Date.UTC(dy, dm - 1, dd + 1, -6, 0, 0, 0));
      const dateOr = [
        { createdAt: { $gte: start, $lt: end } },
        { startedAt: { $gte: start, $lt: end } },
        { endedAt: { $gte: start, $lt: end } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: dateOr }];
        delete query.$or;
      } else {
        query.$or = dateOr;
      }
    }

    // Day of week filter (BD Time)
    if (dayOfWeek) {
      const startOfBdToday = new Date(Date.UTC(bdNow.getUTCFullYear(), bdNow.getUTCMonth(), bdNow.getUTCDate(), -6, 0, 0, 0));
      const endOfBdToday = new Date(startOfBdToday.getTime() + 24 * 60 * 60 * 1000);
      const dayLower = dayOfWeek.toLowerCase().trim();
      const dayOrCondition = [
        { dayOfWeek: dayLower },
        { createdAt: { $gte: startOfBdToday, $lt: endOfBdToday } },
      ];
      if (query.$and) {
        query.$and.push({ $or: dayOrCondition });
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: dayOrCondition }];
        delete query.$or;
      } else {
        query.$or = dayOrCondition;
      }
    }

    // Search filter (searches topic or classId directly)
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const searchOr = [{ topic: regex }, { classId: regex }];
      if (query.$and) {
        query.$and.push({ $or: searchOr });
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    // If 'all' is requested, return all matching docs without pagination
    if (all) {
      const classes = await ClassSessionModel.find(query)
        .populate(POPULATE)
        .sort({ createdAt: -1 })
        .lean();
      return {
        success: true,
        classes,
        pagination: {
          total: classes.length,
          page: 1,
          limit: classes.length,
          totalPages: 1,
        },
      };
    }

    // Paginated: use indexed count + skip + limit directly in MongoDB
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.max(1, parseInt(limit, 10));
    const skip = (p - 1) * l;

    const [classes, total] = await Promise.all([
      ClassSessionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l)
        .populate(POPULATE)
        .lean(),
      ClassSessionModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / l) || 1;

    return {
      success: true,
      classes,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages,
      },
    };
  } catch (e) {
    console.error("getTeacherClasses:", e);
    return { success: false, message: e.message };
  }
}

/** Create a new scheduled class */
export async function createTeacherClass(teacherId, payload) {
  try {
    await ensureModels();
    const { studentId, courseId, dayOfWeek, startTime, notes, duration: rawDuration, meetLink, topic, classType } = payload;

    if (!studentId || !courseId || !dayOfWeek || !startTime || !topic?.trim() || !meetLink?.trim())
      return { success: false, message: "studentId, courseId, dayOfWeek, startTime, topic, and meetLink are required." };

    if (!/^\d{2}:\d{2}$/.test(startTime))
      return { success: false, message: "startTime must be HH:MM format." };

    const duration = Number(rawDuration) || DEFAULT_DURATION;
    if (duration < MIN_DURATION || duration > MAX_DURATION)
      return { success: false, message: `Duration must be between ${MIN_DURATION} and ${MAX_DURATION} minutes.` };

    const startMins = timeToMinutes(startTime);
    const endMins   = startMins + duration;
    if (endMins > 24 * 60)
      return { success: false, message: "Class would extend past midnight." };
    const endTime = minutesToTime(endMins);

    const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
    const now = new Date();
    const bdNow = new Date(now.getTime() + BD_OFFSET_MS);
    const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayDayKey = DAYS[bdNow.getUTCDay()];
    const startOfBdToday = new Date(Date.UTC(bdNow.getUTCFullYear(), bdNow.getUTCMonth(), bdNow.getUTCDate(), 0, 0, 0, 0) - BD_OFFSET_MS);

    // 30-Minute Rule: Classes can only be created starting 30 minutes before scheduled start time
    if (dayOfWeek && dayOfWeek.toLowerCase().trim() === todayDayKey) {
      const curMins = bdNow.getUTCHours() * 60 + bdNow.getUTCMinutes();
      const diff = startMins - curMins;
      if (diff > 30) {
        return {
          success: false,
          message: `Class can only be created starting 30 minutes before scheduled start time (opens at ${minutesToTime(startMins - 30)}, in ${diff - 30} minutes).`,
        };
      }
    }

    let topicTrimmed = topic.trim();
    const escapedTopic = topicTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // ✅ OPTIMIZED: Run validation queries in PARALLEL via Promise.all (1 RTT total instead of 3 sequential)
    const [duplicateTopic, teacherClashes, studentClashes] = await Promise.all([
      ClassSessionModel.findOne({
        teacher: teacherId,
        status: { $in: ["scheduled", "in-progress"] },
        createdAt: { $gte: startOfBdToday },
        topic: { $regex: new RegExp(`^${escapedTopic}$`, "i") },
      }).select("_id").lean(),
      ClassSessionModel.find({
        teacher: teacherId,
        dayOfWeek,
        status: { $in: ["scheduled", "in-progress"] },
        createdAt: { $gte: startOfBdToday },
      }).select("startTime endTime").lean(),
      ClassSessionModel.find({
        student: studentId,
        dayOfWeek,
        status: { $in: ["scheduled", "in-progress"] },
        createdAt: { $gte: startOfBdToday },
      }).select("startTime endTime").lean(),
    ]);

    if (duplicateTopic) {
      topicTrimmed = `${topicTrimmed} (${startTime})`;
    }

    for (const c of teacherClashes) {
      const cs = timeToMinutes(c.startTime), ce = timeToMinutes(c.endTime);
      if (startMins < ce && endMins > cs)
        return { success: false, message: `Conflict: you have a class ${c.startTime}–${c.endTime} on ${dayOfWeek}.` };
    }

    for (const c of studentClashes) {
      const cs = timeToMinutes(c.startTime), ce = timeToMinutes(c.endTime);
      if (startMins < ce && endMins > cs)
        return { success: false, message: `Student has a class ${c.startTime}–${c.endTime} on ${dayOfWeek}.` };
    }

    const normalizeClassType = (val) => {
      if (!val) return "regular";
      const s = String(val).toLowerCase().trim();
      if (s === "retake" || s.includes("retake")) return "retake";
      if (s === "makeup" || s.includes("make-up") || s.includes("makeup")) return "makeup";
      return "regular";
    };
    const finalClassType = normalizeClassType(classType);

    let cleanedMeetLink = (meetLink || "").trim();
    if (!/^https?:\/\//i.test(cleanedMeetLink)) {
      cleanedMeetLink = `https://${cleanedMeetLink}`;
    }

    const doc = new ClassSessionModel({
      teacher: teacherId, student: studentId, course: courseId,
      dayOfWeek, startTime, endTime, duration,
      notes: notes || "", status: "scheduled",
      meetLink: cleanedMeetLink,
      topic: topicTrimmed,
      classType: finalClassType,
    });
    await doc.save();

    const populated = await ClassSessionModel.findById(doc._id).populate(POPULATE).lean();
    return { success: true, class: populated };
  } catch (e) {
    console.error("createTeacherClass:", e);
    return { success: false, message: e.message };
  }
}

/**
 * Update classType for a session ("regular" | "retake" | "makeup")
 */
export async function updateTeacherClassType(classId, teacherId, classType) {
  try {
    await ensureModels();
    let norm = "regular";
    const s = String(classType || "").toLowerCase().trim();
    if (s === "retake" || s.includes("retake")) norm = "retake";
    else if (s === "makeup" || s.includes("make-up") || s.includes("makeup")) norm = "makeup";

    const doc = await ClassSessionModel.findOneAndUpdate(
      { _id: classId, teacher: teacherId },
      { classType: norm },
      { new: true }
    ).populate(POPULATE).lean();
    if (!doc) return { success: false, message: "Class not found or unauthorized" };
    return { success: true, class: doc };
  } catch (e) {
    console.error("updateTeacherClassType:", e);
    return { success: false, message: e.message };
  }
}

/**
 * Update meetLink for a session
 */
export async function updateTeacherMeetLink(classId, teacherId, meetLink) {
  try {
    await ensureModels();
    if (!meetLink || !meetLink.trim()) {
      return { success: false, message: "Meeting link is required." };
    }
    let cleaned = meetLink.trim();
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = `https://${cleaned}`;
    }
    const doc = await ClassSessionModel.findOneAndUpdate(
      { _id: classId, teacher: teacherId },
      { meetLink: cleaned },
      { new: true }
    ).populate(POPULATE).lean();
    if (!doc) return { success: false, message: "Class not found or unauthorized" };
    return { success: true, class: doc };
  } catch (e) {
    console.error("updateTeacherMeetLink:", e);
    return { success: false, message: e.message };
  }
}

/**
 * Auto-create scheduled classes for today:
 * 1) 10 minutes before scheduled start time (or during/past class time today)
 * 2) Ensures all scheduled students for today have classes ready
 */
export async function autoCreateDueClasses(teacherId) {
  try {
    await ensureModels();
    const { ScheduleModel } = await import("@/model/schedule-model");
    const { StudentModel } = await import("@/model/student-model");

    const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
    const now = new Date();
    const bdNow = new Date(now.getTime() + BD_OFFSET_MS);

    const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayDayKey = DAYS[bdNow.getUTCDay()];

    const curMins = bdNow.getUTCHours() * 60 + bdNow.getUTCMinutes();

    const startOfBdToday = new Date(Date.UTC(bdNow.getUTCFullYear(), bdNow.getUTCMonth(), bdNow.getUTCDate(), 0, 0, 0, 0) - BD_OFFSET_MS);
    const endOfBdToday   = new Date(startOfBdToday.getTime() + 24 * 60 * 60 * 1000);

    // 1. Fetch active schedules for this teacher today
    const schedules = await ScheduleModel.find({
      teacher: teacherId,
      isActive: true,
      $or: [
        { dayOfWeek: todayDayKey },
        { weekly_days_list: todayDayKey },
      ],
    })
      .populate("course", "title")
      .populate("student", "fullName studentId teacherId status meetLink")
      .lean();

    if (!schedules || schedules.length === 0) return { success: true, createdCount: 0 };

    // 2. Fetch all sessions already created today for this teacher
    const existingSessions = await ClassSessionModel.find({
      teacher: teacherId,
      createdAt: { $gte: startOfBdToday, $lt: endOfBdToday },
    }).select("student status startTime").lean();

    const existingStudentIds = new Set(
      existingSessions.map((s) => s.student?.toString()).filter(Boolean)
    );

    let createdCount = 0;

    for (const sch of schedules) {
      if (!sch.student || !sch.course) continue;
      const sId = sch.student._id.toString();

      // Check student is currently assigned and active
      if (sch.student.teacherId?.toString() !== teacherId.toString()) continue;
      if (sch.student.status === "suspended") continue;

      // Already has a session created today
      if (existingStudentIds.has(sId)) continue;

      // Check time: within 10 minutes of start time, or at/past start time
      const rawStart = sch.startTime;
      if (!rawStart) continue;

      let startMins = null;
      if (/^\d{1,2}:\d{2}$/.test(rawStart.trim())) {
        const [h, m] = rawStart.trim().split(":").map(Number);
        startMins = h * 60 + m;
      }

      if (startMins === null) continue;

      // Rule: 30 minutes before class start time (or during/past class time)
      if (curMins >= startMins - 30) {
        const duration = Number(sch.duration) || DEFAULT_DURATION;
        const endMins = (startMins + duration) % (24 * 60);
        const formattedStart = `${String(Math.floor(startMins / 60)).padStart(2, "0")}:${String(startMins % 60).padStart(2, "0")}`;
        const formattedEnd = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
        const topicName = `${sch.course.title || "Class Session"} - ${sch.student.fullName}`;

        const newDoc = new ClassSessionModel({
          teacher: teacherId,
          student: sch.student._id,
          course: sch.course._id,
          dayOfWeek: todayDayKey,
          startTime: formattedStart,
          endTime: formattedEnd,
          duration,
          status: "scheduled",
          topic: topicName,
          meetLink: sch.student.meetLink || null,
          notes: "Auto-created 30 minutes before class start",
        });

        await newDoc.save();
        existingStudentIds.add(sId);
        createdCount++;
      }
    }

    return { success: true, createdCount };
  } catch (err) {
    console.error("autoCreateDueClasses error:", err);
    return { success: false, message: err.message };
  }
}

/** Start a class: scheduled → in-progress */
export async function startTeacherClass(classId, teacherId) {
  try {
    await ensureModels();
    const doc = await ClassSessionModel.findOne({ _id: classId, teacher: teacherId });
    if (!doc) return { success: false, message: "Class not found." };
    if (doc.status !== "scheduled")
      return { success: false, message: `Cannot start — class is already ${doc.status}.` };

    doc.status    = "in-progress";
    doc.startedAt = new Date();
    await doc.save();

    const populated = await ClassSessionModel.findById(doc._id).populate(POPULATE).lean();
    return { success: true, class: populated };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/** End a class: in-progress → completed */
export async function endTeacherClass(classId, teacherId, studentAttendance = "not-marked", topic = undefined) {
  try {
    await ensureModels();
    const doc = await ClassSessionModel.findOne({ _id: classId, teacher: teacherId });
    if (!doc) return { success: false, message: "Class not found." };
    if (doc.status !== "in-progress" && doc.status !== "paused")
      return { success: false, message: `Cannot end — class is ${doc.status}.` };

    const now         = new Date();
    const actualMins  = doc.startedAt
      ? Math.round((now - new Date(doc.startedAt)) / 60000)
      : DEFAULT_DURATION;

    doc.status             = "completed";
    doc.endedAt            = now;
    doc.actualDuration     = actualMins;
    doc.studentAttendance  = ["present", "absent", "not-marked"].includes(studentAttendance)
      ? studentAttendance
      : "not-marked";
    if (typeof topic === "string") {
      doc.topic = topic.trim();
    }
    await doc.save();

    const populated = await ClassSessionModel.findById(doc._id).populate(POPULATE).lean();
    return { success: true, class: populated };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/** Update topic for a class */
export async function updateTeacherTopic(classId, teacherId, topic) {
  try {
    await ensureModels();
    const cleaned = typeof topic === "string" ? topic.trim() : "";
    const doc = await ClassSessionModel.findOneAndUpdate(
      { _id: classId, teacher: teacherId },
      { topic: cleaned },
      { new: true }
    ).populate(POPULATE).lean();
    if (!doc) return { success: false, message: "Class not found or unauthorized" };
    return { success: true, class: doc };
  } catch (e) {
    console.error("updateTeacherTopic:", e);
    return { success: false, message: e.message };
  }
}

/** Pause a class: in-progress → paused */
export async function pauseTeacherClass(classId, teacherId) {
  try {
    await ensureModels();
    const doc = await ClassSessionModel.findOne({ _id: classId, teacher: teacherId });
    if (!doc) return { success: false, message: "Class not found." };
    if (doc.status !== "in-progress")
      return { success: false, message: `Cannot pause — class is ${doc.status}.` };

    doc.status = "paused";
    await doc.save();

    const populated = await ClassSessionModel.findById(doc._id).populate(POPULATE).lean();
    return { success: true, class: populated };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/** Resume a class: paused → in-progress */
export async function resumeTeacherClass(classId, teacherId) {
  try {
    await ensureModels();
    const doc = await ClassSessionModel.findOne({ _id: classId, teacher: teacherId });
    if (!doc) return { success: false, message: "Class not found." };
    if (doc.status !== "paused")
      return { success: false, message: `Cannot resume — class is ${doc.status}.` };

    doc.status = "in-progress";
    await doc.save();

    const populated = await ClassSessionModel.findById(doc._id).populate(POPULATE).lean();
    return { success: true, class: populated };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/** Reset a class: in-progress/paused → scheduled */
export async function resetTeacherClass(classId, teacherId) {
  try {
    await ensureModels();
    const doc = await ClassSessionModel.findOne({ _id: classId, teacher: teacherId });
    if (!doc) return { success: false, message: "Class not found." };
    if (doc.status !== "in-progress" && doc.status !== "paused")
      return { success: false, message: `Cannot reset — class is ${doc.status}.` };

    doc.status = "scheduled";
    doc.startedAt = null;
    doc.endedAt = null;
    await doc.save();

    const populated = await ClassSessionModel.findById(doc._id).populate(POPULATE).lean();
    return { success: true, class: populated };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/** Delete a class */
export async function deleteTeacherClass(classId, teacherId) {
  try {
    await dbConnect();
    const doc = await ClassSessionModel.findOne({ _id: classId, teacher: teacherId });
    if (!doc) return { success: false, message: "Class not found." };
    if (doc.status === "completed")
      return { success: false, message: "Cannot delete a completed class." };
    await ClassSessionModel.findByIdAndDelete(classId);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/** Courses for dropdown */
export async function getAllCoursesForDropdown() {
  try {
    await dbConnect();
    const courses = await CourseModel.find({ isActive: true })
      .select("_id title courseId level")
      .sort({ title: 1 })
      .lean();
    return { success: true, courses };
  } catch (e) {
    return { success: false, message: e.message };
  }
}