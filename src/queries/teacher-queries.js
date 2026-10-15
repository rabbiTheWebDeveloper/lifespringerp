import { dbConnect } from "@/service/mongo";
import { TeacherModel } from "@/model/teacher-model";
import { CourseModel } from "@/model/course-model";
import { UserModel } from "@/model/user-model";
import { PaymentInfoModel } from "@/model/paymentInfo-model";
import { TeacherCategoryModel } from "@/model/teacher-category-model";
import { escapeRegex } from "@/lib/utils";

/**
 * Get paginated list of teachers
 */
export async function getAllTeachers({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  version = "",
  category = "",
  idCardStatus = "",
  salaryType = "",
  simple = false,
  minimal = false,
} = {}) {
  await dbConnect();

  const query = {};
  if (status && status !== "all") query.status = status;
  if (version && version !== "all") query.version = version;
  if (category && category !== "all") query.category = category;
  if (idCardStatus && idCardStatus !== "all") query.idCardStatus = idCardStatus;
  if (salaryType && salaryType !== "all") query.salaryType = salaryType;
  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    query.$or = [
      { fullName: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { teacherId: { $regex: escaped, $options: "i" } },
      { specialization: { $regex: escaped, $options: "i" } },
    ];
  }

  const isMinimal = Boolean(simple || minimal);
  if (isMinimal) {
    const skip = (page - 1) * limit;
    const [teachers, total] = await Promise.all([
      TeacherModel.find(query)
        .select("_id fullName teacherId avatar status specialization email gender phone")
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TeacherModel.countDocuments(query),
    ]);

    return {
      teachers,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  const skip = (page - 1) * limit;
  const [teachers, total] = await Promise.all([
    TeacherModel.find(query)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TeacherModel.countDocuments(query),
  ]);

  // Attach PaymentInfo to teachers
  if (teachers.length > 0) {
    const emails = teachers.map(t => t.email).filter(Boolean);
    const users = await UserModel.find({ email: { $in: emails } }).select('_id email').lean();
    const emailToUserId = {};
    users.forEach(u => emailToUserId[u.email] = u._id.toString());
    
    const searchIds = [...teachers.map(t => t._id)];
    users.forEach(u => searchIds.push(u._id));

    const paymentInfos = await PaymentInfoModel.find({ userId: { $in: searchIds } }).lean();
    const idToPaymentInfo = {};
    paymentInfos.forEach(p => idToPaymentInfo[p.userId.toString()] = p);
    
    // Fetch all students assigned to these teachers
    const { StudentModel } = await import("@/model/student-model");
    const teacherObjectIds = teachers.map(t => t._id);
    const allStudents = await StudentModel.find({ teacherId: { $in: teacherObjectIds } })
      .select("fullName phone studentId teacherId email gender status course teacherHistory classStartingDate createdAt")
      .populate("course", "title courseId")
      .lean();
    
    teachers.forEach(t => {
      const tId = t._id.toString();
      const uId = t.email && emailToUserId[t.email];
      t.paymentInfo = idToPaymentInfo[tId] || (uId ? idToPaymentInfo[uId] : null) || null;
      
      // Filter students for this teacher
      const assigned = allStudents.filter(s => s.teacherId?.toString() === tId);
      t.studentCount = assigned.length;
      t.studentsList = assigned.map(s => {
        const activeEntry = (s.teacherHistory || []).slice().reverse().find(
          h => h.teacher?.toString() === tId && !h.unassignedAt
        );
        return {
          _id: s._id,
          fullName: s.fullName,
          phone: s.phone || "",
          email: s.email || "",
          gender: s.gender || "male",
          studentId: s.studentId,
          status: s.status || "active",
          course: s.course,
          assignedAt: activeEntry?.assignedAt || s.classStartingDate || s.createdAt || null,
          note: activeEntry?.note || "",
        };
      });
    });
  }

  return {
    teachers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get a single teacher by ID with their courses
 */
export async function getTeacherById(id) {
  await dbConnect();
  const teacher = await TeacherModel.findById(id).populate("category").lean();
  if (!teacher) return null;

  const courses = await CourseModel.find({ instructor: id })
    .select("title status enrolledCount category")
    .lean();

  const teacherId = teacher._id.toString();
  let pInfo = await PaymentInfoModel.findOne({ userId: teacherId }).lean();
  
  if (!pInfo && teacher.email) {
    const user = await UserModel.findOne({ email: teacher.email }).select('_id').lean();
    if (user) {
      pInfo = await PaymentInfoModel.findOne({ userId: user._id }).lean();
    }
  }

  if (pInfo) {
    teacher.paymentInfo = pInfo;
  }

  return { ...teacher, courses };
}

/**
 * Create a new teacher.
 * Normalizes empty-string email → undefined so the sparse unique index
 * is never triggered by teachers without an email address.
 */
export async function createTeacher(data) {
  await dbConnect();

  // Normalize: treat empty / whitespace-only email as "no email"
  if (!data.email || !data.email.trim()) {
    data = { ...data, email: undefined };
  }

  if (data.category === "") {
    delete data.category;
  }

  const teacher = new TeacherModel(data);
  await teacher.save();
  return teacher.toObject();
}

/**
 * Update a teacher by ID
 */
export async function updateTeacher(id, data) {
  await dbConnect();
  
  if (data.category === "") {
    data.category = undefined;
  }

  if (data.paymentInfo) {
    // 1. Update/insert payment info directly linked to the Teacher's own ID
    await PaymentInfoModel.findOneAndUpdate(
      { userId: id },
      { $set: { ...data.paymentInfo, userModel: "Teacher" } },
      { upsert: true }
    );

    // 2. Also update/insert linked to the User ID if it exists
    const teacherForEmail = await TeacherModel.findById(id).select('email').lean();
    if (teacherForEmail && teacherForEmail.email) {
      const user = await UserModel.findOne({ email: teacherForEmail.email }).select('_id').lean();
      if (user) {
        await PaymentInfoModel.findOneAndUpdate(
          { userId: user._id },
          { $set: { ...data.paymentInfo, userModel: "Teacher" } },
          { upsert: true }
        );
      }
    }
    delete data.paymentInfo;
  }

  const teacher = await TeacherModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
  return teacher;
}

/**
 * Delete a teacher by ID
 */
export async function deleteTeacher(id) {
  await dbConnect();
  await TeacherModel.findByIdAndDelete(id);
  return { success: true };
}

/**
 * Get teacher dashboard stats
 */
export async function getTeacherDashboardStats() {
  await dbConnect();
  const [total, active, onLeave] = await Promise.all([
    TeacherModel.countDocuments(),
    TeacherModel.countDocuments({ status: "active" }),
    TeacherModel.countDocuments({ status: "on-leave" }),
  ]);

  // Average rating
  const ratingAgg = await TeacherModel.aggregate([
    { $match: { totalRatings: { $gt: 0 } } },
    { $group: { _id: null, avgRating: { $avg: "$rating" } } },
  ]);
  const avgRating = ratingAgg[0]?.avgRating?.toFixed(1) || 0;

  return { total, active, onLeave, avgRating };
}

// ─── TEACHER CATEGORIES ───────────────────────────────────────────────────────

export async function getTeacherCategories() {
  await dbConnect();
  let categories = await TeacherCategoryModel.find({}).sort({ name: 1 }).lean();
  if (categories.length === 0) {
    const defaults = [
      { name: "Senior Teacher", description: "Highly experienced senior teacher" },
      { name: "Junior Teacher", description: "Regular junior teacher" },
      { name: "Kids Specialist Teacher", description: "Specialized in teaching children" },
      { name: "Kids Junior Teacher", description: "Junior instructor for children" },
      { name: "Kids Basic Teacher", description: "Basic instructor for children" },
      { name: "Hifz Teacher", description: "Specialized in Quran memorization (Hifz)" },
      { name: "Pre-Hifz Teacher", description: "Specialized in preparation for Quran memorization" },
    ];
    const seeded = defaults.map(d => ({
      ...d,
      slug: d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    }));
    await TeacherCategoryModel.insertMany(seeded);
    categories = await TeacherCategoryModel.find({}).sort({ name: 1 }).lean();
  }
  return categories;
}

export async function createTeacherCategory(data) {
  await dbConnect();
  const slug = data.slug || (data.name ? data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : "");
  const category = new TeacherCategoryModel({
    name: data.name?.trim(),
    slug,
    description: data.description?.trim() || "",
    status: data.status || "active",
  });
  await category.save();
  return category.toObject();
}

export async function updateTeacherCategory(id, data) {
  await dbConnect();
  const updatePayload = {};
  if (data.name !== undefined) {
    updatePayload.name = data.name.trim();
    updatePayload.slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  }
  if (data.description !== undefined) {
    updatePayload.description = data.description.trim();
  }
  if (data.status !== undefined) {
    updatePayload.status = data.status;
  }

  const updated = await TeacherCategoryModel.findByIdAndUpdate(
    id,
    { $set: updatePayload },
    { new: true, runValidators: true }
  ).lean();
  return updated;
}

export async function deleteTeacherCategory(id) {
  await dbConnect();
  await TeacherCategoryModel.findByIdAndDelete(id);
  return { success: true };
}

// ─── TEACHER ASSIGNED STUDENTS & HISTORY TRACKING ────────────────────────────

/**
 * Get all students currently assigned to a teacher, plus full history of past/present students
 */
export async function getTeacherAssignedStudents(teacherId) {
  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const { StudentModel } = await import("@/model/student-model");
  const tid = mongoose.isValidObjectId(teacherId) ? new mongoose.Types.ObjectId(teacherId) : teacherId;

  // 1. Currently assigned students
  const assignedDocs = await StudentModel.find({ teacherId: tid })
    .populate("course", "title courseId")
    .sort({ createdAt: -1 })
    .lean();

  const assigned = assignedDocs.map(s => {
    const activeEntry = (s.teacherHistory || []).slice().reverse().find(
      h => h.teacher?.toString() === teacherId.toString() && !h.unassignedAt
    );
    return {
      _id: s._id,
      studentId: s.studentId,
      fullName: s.fullName,
      phone: s.phone || "",
      email: s.email || "",
      gender: s.gender || "male",
      status: s.status || "active",
      course: s.course,
      classStartingDate: s.classStartingDate || null,
      assignedAt: activeEntry?.assignedAt || s.classStartingDate || s.createdAt || null,
      note: activeEntry?.note || "",
      historyId: activeEntry?._id || null,
    };
  });

  // 2. Full student history records for this teacher
  const historyDocs = await StudentModel.find({ "teacherHistory.teacher": tid })
    .populate("course", "title courseId")
    .select("fullName studentId phone email gender status course avatar teacherId teacherHistory createdAt classStartingDate")
    .lean();

  const history = [];
  for (const s of historyDocs) {
    const entries = (s.teacherHistory || []).filter(
      h => h.teacher?.toString() === teacherId.toString()
    );
    for (const entry of entries) {
      history.push({
        _id: entry._id || `${s._id}_${entry.assignedAt}`,
        student: {
          _id: s._id,
          fullName: s.fullName,
          studentId: s.studentId,
          phone: s.phone || "",
          email: s.email || "",
          gender: s.gender || "male",
          status: s.status || "active",
          course: s.course,
          avatar: s.avatar || "",
          isCurrentlyAssigned: s.teacherId?.toString() === teacherId.toString(),
        },
        assignedAt: entry.assignedAt || s.classStartingDate || s.createdAt || null,
        unassignedAt: entry.unassignedAt || null,
        note: entry.note || "",
        isActive: !entry.unassignedAt && s.teacherId?.toString() === teacherId.toString(),
      });
    }
  }

  // Sort history: most recently unassigned or assigned first
  history.sort((a, b) => {
    const timeA = new Date(a.unassignedAt || a.assignedAt || 0).getTime();
    const timeB = new Date(b.unassignedAt || b.assignedAt || 0).getTime();
    return timeB - timeA;
  });

  return { assigned, history };
}

/**
 * Get available students that can be assigned to this teacher
 */
export async function getAvailableStudentsForTeacher({ teacherId, search = "" } = {}) {
  await dbConnect();
  const { StudentModel } = await import("@/model/student-model");
  const query = {};

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    query.$or = [
      { fullName: { $regex: escaped, $options: "i" } },
      { studentId: { $regex: escaped, $options: "i" } },
      { phone: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  } else {
    // Default to unassigned students
    query.teacherId = null;
  }

  const students = await StudentModel.find(query)
    .populate("course", "title courseId")
    .populate("teacherId", "fullName teacherId")
    .select("fullName studentId phone email status course teacherId classStartingDate createdAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return students.map(s => ({
    _id: s._id,
    fullName: s.fullName,
    studentId: s.studentId,
    phone: s.phone || "",
    email: s.email || "",
    status: s.status,
    course: s.course,
    currentTeacher: s.teacherId ? {
      _id: s.teacherId._id,
      fullName: s.teacherId.fullName,
      teacherId: s.teacherId.teacherId,
    } : null,
    isCurrentTeacherThis: s.teacherId ? (s.teacherId._id?.toString() === teacherId?.toString()) : false,
  }));
}

/**
 * Assign a student to a teacher with date and note tracking
 */
export async function assignStudentToTeacher({ teacherId, studentId, assignedAt, note = "" }) {
  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const { StudentModel } = await import("@/model/student-model");

  const tid = mongoose.isValidObjectId(teacherId) ? new mongoose.Types.ObjectId(teacherId) : teacherId;
  const sid = mongoose.isValidObjectId(studentId) ? new mongoose.Types.ObjectId(studentId) : studentId;

  const teacher = await TeacherModel.findById(tid).lean();
  if (!teacher) throw new Error("Teacher not found");

  const student = await StudentModel.findById(sid);
  if (!student) throw new Error("Student not found");

  const assignDate = assignedAt ? new Date(assignedAt) : new Date();

  // If student was previously assigned to another teacher, mark unassignedAt on that teacher's record
  if (student.teacherId && student.teacherId.toString() !== teacher._id.toString()) {
    const prevEntry = (student.teacherHistory || []).slice().reverse().find(
      h => h.teacher?.toString() === student.teacherId.toString() && !h.unassignedAt
    );
    if (prevEntry) {
      prevEntry.unassignedAt = assignDate;
      prevEntry.note = prevEntry.note ? `${prevEntry.note} (Reassigned to ${teacher.fullName})` : `Reassigned to ${teacher.fullName}`;
    }
  }

  // Check if open entry for this teacher already exists
  const existingOpen = (student.teacherHistory || []).slice().reverse().find(
    h => h.teacher?.toString() === teacher._id.toString() && !h.unassignedAt
  );

  if (existingOpen) {
    existingOpen.assignedAt = assignDate;
    if (note) existingOpen.note = note;
  } else {
    student.teacherHistory = student.teacherHistory || [];
    student.teacherHistory.push({
      teacher: teacher._id,
      teacherName: teacher.fullName || "",
      teacherId: teacher.teacherId || "",
      assignedAt: assignDate,
      note: note || "",
    });
  }

  student.teacherId = teacher._id;
  await student.save();

  return student.toObject();
}

/**
 * Unassign a student from a teacher with date and note tracking
 */
export async function unassignStudentFromTeacher({ teacherId, studentId, unassignedAt, note = "" }) {
  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const { StudentModel } = await import("@/model/student-model");

  const tid = mongoose.isValidObjectId(teacherId) ? new mongoose.Types.ObjectId(teacherId) : teacherId;
  const sid = mongoose.isValidObjectId(studentId) ? new mongoose.Types.ObjectId(studentId) : studentId;

  const teacher = await TeacherModel.findById(tid).lean();
  if (!teacher) throw new Error("Teacher not found");

  const student = await StudentModel.findById(sid);
  if (!student) throw new Error("Student not found");

  const unassignDate = unassignedAt ? new Date(unassignedAt) : new Date();

  const lastEntry = (student.teacherHistory || []).slice().reverse().find(
    h => h.teacher?.toString() === teacher._id.toString() && !h.unassignedAt
  );

  if (lastEntry) {
    lastEntry.unassignedAt = unassignDate;
    if (note) lastEntry.note = note;
  } else {
    student.teacherHistory = student.teacherHistory || [];
    student.teacherHistory.push({
      teacher: teacher._id,
      teacherName: teacher.fullName || "",
      teacherId: teacher.teacherId || "",
      assignedAt: student.classStartingDate || student.createdAt || unassignDate,
      unassignedAt: unassignDate,
      note: note || "",
    });
  }

  student.teacherId = null;
  await student.save();

  return student.toObject();
}

/**
 * Teacher Note & Timeline queries
 */
export async function getTeacherNotes(teacherId) {
  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const TeacherNote = (await import("@/model/teacher-note-model")).default;
  await import("@/model/user-model");

  const tid = mongoose.isValidObjectId(teacherId) ? new mongoose.Types.ObjectId(teacherId) : teacherId;

  const doc = await TeacherNote.findOne({ teacherId: tid })
    .populate("note.userId", "fullName email avatar role designation department")
    .lean();

  if (!doc) {
    return {
      teacherId,
      notes: [],
    };
  }

  const sortedNotes = (doc.note || []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    _id: doc._id,
    teacherId: doc.teacherId,
    notes: sortedNotes,
    totalNotes: sortedNotes.length,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
  };
}

export async function addTeacherNote({ teacherId, userId, name, createdAt }) {
  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const TeacherNote = (await import("@/model/teacher-note-model")).default;
  await import("@/model/user-model");

  const tid = mongoose.isValidObjectId(teacherId) ? new mongoose.Types.ObjectId(teacherId) : teacherId;
  const uid = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;

  let doc = await TeacherNote.findOne({ teacherId: tid });
  if (!doc) {
    doc = new TeacherNote({
      teacherId: tid,
      note: [],
    });
  }

  const newNoteItem = {
    noteCreateId: new mongoose.Types.ObjectId(),
    userId: uid,
    name: (name || "").trim(),
    createdAt: createdAt ? new Date(createdAt) : new Date(),
  };

  doc.note.push(newNoteItem);
  await doc.save();

  const populatedDoc = await TeacherNote.findById(doc._id)
    .populate("note.userId", "fullName email avatar role designation department")
    .lean();

  const createdNote = populatedDoc.note.find(
    n => n.noteCreateId?.toString() === newNoteItem.noteCreateId.toString()
  ) || populatedDoc.note[populatedDoc.note.length - 1];

  return {
    teacherId: doc.teacherId,
    note: createdNote,
    allNotes: (populatedDoc.note || []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  };
}

export async function deleteTeacherNote({ teacherId, noteId }) {
  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const TeacherNote = (await import("@/model/teacher-note-model")).default;
  await import("@/model/user-model");

  const tid = mongoose.isValidObjectId(teacherId) ? new mongoose.Types.ObjectId(teacherId) : teacherId;

  const doc = await TeacherNote.findOne({ teacherId: tid });
  if (!doc) throw new Error("Teacher notes not found");

  doc.note = doc.note.filter(n => {
    const id1 = n.noteCreateId?.toString();
    const id2 = n._id?.toString();
    const target = noteId?.toString();
    return id1 !== target && id2 !== target;
  });

  await doc.save();

  const populatedDoc = await TeacherNote.findById(doc._id)
    .populate("note.userId", "fullName email avatar role designation department")
    .lean();

  return {
    teacherId: doc.teacherId,
    allNotes: (populatedDoc.note || []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  };
}


