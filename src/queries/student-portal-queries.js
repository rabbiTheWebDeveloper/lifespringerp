import { dbConnect } from "@/service/mongo";
import mongoose from "mongoose";

// Helper to get Models safely
const getModels = async () => {
  await dbConnect();
  
  if (!mongoose.models.Student) await import("@/model/student-model");
  if (!mongoose.models.Course) await import("@/model/course-model");
  if (!mongoose.models.Enrollment) await import("@/model/enrollment-model");
  if (!mongoose.models.Assessment) await import("@/model/assessment-model");
  if (!mongoose.models.Submission) await import("@/model/submission-model");
  if (!mongoose.models.SupportTicket) await import("@/model/support-ticket-model");
  if (!mongoose.models.Schedule) await import("@/model/schedule-model");
  if (!mongoose.models.Payment) await import("@/model/payment-model");
  if (!mongoose.models.ClassSession) await import("@/model/class-model");

  return {
    Student: mongoose.models.Student,
    Course: mongoose.models.Course,
    Enrollment: mongoose.models.Enrollment,
    Assessment: mongoose.models.Assessment,
    Submission: mongoose.models.Submission,
    SupportTicket: mongoose.models.SupportTicket,
    Schedule: mongoose.models.Schedule,
    Payment: mongoose.models.Payment,
    ClassSession: mongoose.models.ClassSession,
  };
};

export async function getStudentDashboardStats(studentId) {
  try {
    const { Enrollment, Submission, SupportTicket, Student, Payment, Schedule, Assessment, ClassSession } = await getModels();
    
    const classesData = await getStudentClasses(studentId);
    const enrolledCoursesCount = classesData.classes.length;
    
    // Calculate average progress
    const totalProgress = classesData.classes.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    const avgProgress = enrolledCoursesCount > 0 ? Math.round(totalProgress / enrolledCoursesCount) : 0;

    const courseIds = classesData.classes.map(e => e._id).filter(Boolean);

    // Get assignments the student hasn't submitted yet
    const activeAssessments = courseIds.length > 0 ? await Assessment.find({ 
      course: { $in: courseIds },
      status: { $in: ["active", "grading"] } 
    }).lean() : [];
    
    const submittedDocs = await Submission.find({ student: studentId }).lean();
    const submittedIds = submittedDocs.map(s => s.assessment?.toString()).filter(Boolean);
    const pendingAssignments = activeAssessments.filter(a => !submittedIds.includes(a._id?.toString())).length;

    const studentUser = await Student.findById(studentId).lean();
    const unreadMessages = studentUser?.email ? await SupportTicket.countDocuments({ 
      raisedByModel: "Student", 
      raisedByEmail: studentUser.email,
      status: "in-progress"
    }) : 0;

    // Check payment status for the current month
    const now = new Date();
    const currentMonthString = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    const hasPaid = await Payment.exists({
      student: studentId,
      month: currentMonthString,
      status: "completed"
    });

    let notice = null;
    if (!hasPaid) {
      notice = {
        type: "warning",
        message: `Please pay your due for ${currentMonthString}.`
      };
    }

    const schedule = await Schedule.findOne({ student: studentId, isActive: true })
      .populate('course', 'title')
      .populate('teacher', 'fullName avatar email meetLink')
      .lean();

    // ── BD Today Date Boundaries & Day Name ──
    const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
    const bdNow = new Date(Date.now() + BD_OFFSET_MS);
    const startOfBdToday = new Date(Date.UTC(bdNow.getUTCFullYear(), bdNow.getUTCMonth(), bdNow.getUTCDate(), 0, 0, 0, 0) - BD_OFFSET_MS);
    const endOfBdToday = new Date(startOfBdToday.getTime() + 24 * 60 * 60 * 1000 - 1);
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDayOfWeek = dayNames[bdNow.getUTCDay()];

    // ── Today's Resolved Schedule ──
    let todaySchedule = null;
    if (schedule) {
      const todayDayTime = schedule.day_times?.find(
        (dt) => (dt.day || "").toLowerCase().trim() === currentDayOfWeek
      );
      const isDayInList = (schedule.weekly_days_list || [])
        .map((d) => (d || "").toLowerCase().trim())
        .includes(currentDayOfWeek);

      if (isDayInList || todayDayTime) {
        todaySchedule = {
          dayOfWeek: currentDayOfWeek,
          startTime: todayDayTime?.startTime || schedule.startTime || "",
          endTime: todayDayTime?.endTime || schedule.endTime || "",
          duration: todayDayTime?.duration || schedule.duration || 45,
          course: schedule.course,
          teacher: schedule.teacher,
          meetLink: schedule.teacher?.meetLink || null,
        };
      }
    }

    // ── Today's Live or Scheduled Class Session ──
    let todayLiveSession = null;
    if (ClassSession) {
      // First check for active in-progress or paused class
      todayLiveSession = await ClassSession.findOne({
        student: studentId,
        status: { $in: ["in-progress", "paused"] },
      })
        .populate("teacher", "fullName avatar email meetLink")
        .populate("course", "title")
        .sort({ updatedAt: -1 })
        .lean();

      // If no live session, check for scheduled/completed session today
      if (!todayLiveSession) {
        todayLiveSession = await ClassSession.findOne({
          student: studentId,
          createdAt: { $gte: startOfBdToday, $lte: endOfBdToday },
          status: { $in: ["scheduled", "completed"] },
        })
          .populate("teacher", "fullName avatar email meetLink")
          .populate("course", "title")
          .sort({ createdAt: -1 })
          .lean();
      }
    }

    // ── Recent Completed Lesson Feedback / Sabak for Guardian ──
    let recentFeedback = null;
    if (ClassSession) {
      const lastCompleted = await ClassSession.findOne({
        student: studentId,
        status: "completed",
      })
        .populate("teacher", "fullName avatar")
        .populate("course", "title")
        .sort({ endedAt: -1, createdAt: -1 })
        .lean();

      if (lastCompleted) {
        recentFeedback = {
          topic: lastCompleted.topic || "Quran & Tajweed Practice",
          notes: lastCompleted.notes || "Good participation and focus during class.",
          attendance: lastCompleted.studentAttendance || "present",
          duration: lastCompleted.actualDuration || lastCompleted.duration || 45,
          classId: lastCompleted.classId,
          date: lastCompleted.endedAt || lastCompleted.createdAt,
          teacherName: lastCompleted.teacher?.fullName || "Teacher",
          teacherAvatar: lastCompleted.teacher?.avatar || null,
          courseTitle: lastCompleted.course?.title || "Quran Course",
        };
      }
    }

    // ── Streak Calculation (Consecutive Present Attendances) ──
    let streakCount = 0;
    let monthlyPresent = 0;
    let monthlyTotal = 0;

    if (ClassSession) {
      const startOfMonth = new Date(Date.UTC(bdNow.getUTCFullYear(), bdNow.getUTCMonth(), 1, 0, 0, 0, 0) - BD_OFFSET_MS);
      const pastSessions = await ClassSession.find({
        student: studentId,
        status: "completed",
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      for (const s of pastSessions) {
        if (s.studentAttendance === "present") {
          streakCount++;
        } else {
          break;
        }
      }

      const monthSessions = await ClassSession.find({
        student: studentId,
        status: "completed",
        createdAt: { $gte: startOfMonth },
      }).lean();

      monthlyTotal = monthSessions.length;
      monthlyPresent = monthSessions.filter((s) => s.studentAttendance === "present").length;
    }

    // ── Curated Daily Islamic Inspiration ──
    const inspirations = [
      {
        arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
        english: "The best among you are those who learn the Quran and teach it.",
        source: "Sahih al-Bukhari 5027",
      },
      {
        arabic: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ",
        english: "Seeking knowledge is an obligation upon every Muslim.",
        source: "Sunan Ibn Majah 224",
      },
      {
        arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
        english: "Indeed, with hardship comes ease.",
        source: "Surah Ash-Sharh 94:6",
      },
      {
        arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
        english: "And say: 'My Lord, increase me in knowledge.'",
        source: "Surah Taha 20:114",
      },
      {
        arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
        english: "Whoever takes a path upon which he seeks knowledge, Allah makes the path to Paradise easy for him.",
        source: "Sahih Muslim 2699",
      },
    ];
    const dayOfYear = Math.floor((bdNow.getTime() - new Date(bdNow.getUTCFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const dailyInspiration = inspirations[dayOfYear % inspirations.length];

    return {
      success: true,
      stats: {
        enrolledCourses: enrolledCoursesCount,
        avgProgress,
        pendingAssignments,
        unreadMessages,
        notice,
        schedule,
        todaySchedule,
        todayLiveSession,
        recentFeedback,
        streakCount: Math.max(streakCount, 1),
        monthlyAttendance: {
          present: monthlyPresent,
          total: monthlyTotal,
          percentage: monthlyTotal > 0 ? Math.round((monthlyPresent / monthlyTotal) * 100) : 100,
        },
        dailyInspiration,
      },
    };
  } catch (error) {
    console.error("Student Stats Error:", error);
    return { success: false, message: error.message };
  }
}

export async function getStudentClasses(studentId) {
  try {
    const { Student, Course, Enrollment, ClassSession, Schedule } = await getModels();
    
    // 1. Fetch direct Enrollments
    const enrollments = await Enrollment.find({ student: studentId })
      .populate('course')
      .sort({ createdAt: -1 })
      .lean();
      
    // Format classes from enrollments
    const classes = (enrollments || [])
      .filter(e => e.course)
      .map(e => ({
        ...e.course,
        enrollmentId: e._id,
        progress: e.progress || 0,
        enrollmentStatus: e.status || "active"
      }));

    // Helper to check if a course is already registered in the classes list
    const isCourseAlreadyListed = (courseIdOrDoc, courseTitle) => {
      const targetId = courseIdOrDoc?._id ? courseIdOrDoc._id.toString() : (courseIdOrDoc ? courseIdOrDoc.toString() : "");
      const targetTitle = (courseTitle || courseIdOrDoc?.title || "").trim().toLowerCase();

      return classes.some(c => {
        const cId = c._id ? c._id.toString() : "";
        const cTitle = (c.title || "").trim().toLowerCase();
        return (targetId && cId && targetId === cId) || (targetTitle && cTitle && targetTitle === cTitle);
      });
    };

    // 2. Also check Student profile course & Schedule courses
    const studentDoc = await Student.findById(studentId).lean();
    let assignedTeacher = null;
    if (studentDoc?.teacherId) {
      try {
        const { TeacherModel } = await import("@/model/teacher-model");
        assignedTeacher = await TeacherModel.findById(studentDoc.teacherId).select("fullName email avatar").lean();
      } catch {}
    }

    if (studentDoc?.course && !isCourseAlreadyListed(studentDoc.course)) {
      const courseVal = studentDoc.course;
      let courseDoc = null;
      try {
        if (mongoose.isValidObjectId(courseVal)) {
          courseDoc = await Course.findById(courseVal).lean();
        } else {
          courseDoc = await Course.findOne({ title: courseVal }).lean();
        }
      } catch {}

      if (courseDoc && !isCourseAlreadyListed(courseDoc._id, courseDoc.title)) {
        classes.push({
          ...courseDoc,
          instructor: assignedTeacher,
          progress: 0,
          enrollmentStatus: "active"
        });
      } else if (typeof courseVal === "string" && courseVal.trim() && !isCourseAlreadyListed(null, courseVal)) {
        classes.push({
          _id: `course_profile_${studentDoc._id}`,
          title: courseVal,
          category: "Islamic Studies",
          level: "Standard",
          instructor: assignedTeacher || { fullName: "FAJR Instructor" },
          progress: 0,
          enrollmentStatus: "active",
          createdAt: studentDoc.createdAt || new Date(),
          updatedAt: studentDoc.updatedAt || new Date()
        });
      }
    }

    // 3. Check Schedule for any additional courses & teacher info
    const schedules = await Schedule.find({ student: studentId, isActive: true })
      .populate('course')
      .populate('teacher', 'fullName email avatar')
      .lean();

    (schedules || []).forEach(s => {
      if (s.course) {
        const cTitle = typeof s.course === "object" ? s.course.title : s.course;
        const cId = typeof s.course === "object" && s.course._id ? s.course._id.toString() : "";
        if (!isCourseAlreadyListed(cId, cTitle)) {
          classes.push({
            ...(typeof s.course === "object" ? s.course : { _id: `sch_${s._id}`, title: s.course }),
            instructor: s.teacher || assignedTeacher,
            progress: 0,
            enrollmentStatus: "active"
          });
        }
      }
    });

    // 4. Fetch class history (completed sessions)
    const history = await ClassSession.find({ student: studentId, status: "completed" })
      .populate('course', 'title level category')
      .populate('teacher', 'fullName avatar')
      .sort({ endedAt: -1, createdAt: -1 })
      .lean();

    // 5. Fetch active/scheduled class sessions
    let activeSessions = await ClassSession.find({
      student: studentId,
      status: { $in: ["scheduled", "in-progress"] }
    })
      .populate('course', 'title level category')
      .populate('teacher', 'fullName avatar')
      .sort({ startTime: 1 })
      .lean();

    // If no explicit ClassSession records exist yet, generate upcoming scheduled cards from active Schedule
    if (activeSessions.length === 0 && schedules.length > 0) {
      activeSessions = schedules.flatMap(sch => {
        const list = sch.day_times && sch.day_times.length > 0
          ? sch.day_times
          : [{ day: sch.dayOfWeek || "monday", startTime: sch.startTime || "10:00", endTime: sch.endTime || "10:45" }];

        return list.map((dt, idx) => ({
          _id: `${sch._id}_${idx}`,
          course: sch.course || { title: "Enrolled Course" },
          teacher: sch.teacher || assignedTeacher || { fullName: "Certified Instructor" },
          dayOfWeek: dt.day,
          startTime: dt.startTime,
          endTime: dt.endTime,
          status: "scheduled",
          meetLink: sch.meetLink || null
        }));
      });
    }

    // 6. Fallback: Only if student has zero enrolled courses, check current active/upcoming sessions
    // Note: Completed sessions from history must NEVER be pushed into active Enrolled Courses.
    if (classes.length === 0 && activeSessions.length > 0) {
      activeSessions.forEach(sess => {
        if (sess.course) {
          const courseTitle = typeof sess.course === "object" ? sess.course.title : sess.course;
          const courseId = typeof sess.course === "object" && sess.course._id ? sess.course._id.toString() : "";
          if (!isCourseAlreadyListed(courseId, courseTitle) && courseTitle) {
            classes.push({
              _id: courseId || `session_course_${sess._id}`,
              title: courseTitle,
              category: (typeof sess.course === "object" && sess.course.category) || "Islamic Studies",
              level: (typeof sess.course === "object" && sess.course.level) || "All Levels",
              instructor: (typeof sess.course === "object" && sess.course.instructor) || sess.teacher || assignedTeacher,
              progress: 0,
              enrollmentStatus: "active",
              createdAt: sess.createdAt || new Date(),
              updatedAt: sess.updatedAt || new Date()
            });
          }
        }
      });
    }

    // 7. Compute dynamic progress for each course based on completed class sessions & curriculum progression
    classes.forEach(c => {
      const cId = c._id ? c._id.toString() : "";
      const cTitle = c.title || "";

      // Count completed sessions for this specific course
      const completedForCourse = history.filter(h => {
        const hId = h.course?._id ? h.course._id.toString() : (h.course?.toString() || "");
        const hTitle = h.course?.title || (typeof h.course === "string" ? h.course : "");
        return (
          (cId && hId && cId === hId) ||
          (cTitle && hTitle && cTitle.toLowerCase() === hTitle.toLowerCase())
        );
      }).length;

      // If explicit enrollment progress > 0, use it; otherwise compute based on completed sessions
      if (typeof c.progress === "number" && c.progress > 0) {
        c.progress = Math.min(100, c.progress);
      } else if (completedForCourse > 0) {
        // Milestone formula: 12 sessions per term (1 session = ~8-10%, 2 sessions = ~17-20%, 12+ sessions = 100%)
        c.progress = Math.min(100, Math.round((completedForCourse / 10) * 100));
      } else {
        c.progress = 0;
      }
    });

    return { success: true, classes, history, activeSessions };
  } catch (error) {
    console.error("getStudentClasses error:", error);
    return { success: false, message: error.message, classes: [], history: [], activeSessions: [] };
  }
}

export async function getStudentSchedule(studentId) {
  try {
    const { Schedule } = await getModels();
    const schedule = await Schedule.findOne({ student: studentId })
      .populate('course', 'title')
      .populate('teacher', 'fullName email')
      .lean();
      
    return { success: true, schedule };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function getStudentAssignments(studentId) {
  try {
    const { Enrollment, Assessment, Submission } = await getModels();
    const enrollments = await Enrollment.find({ student: studentId }).lean();
    const courseIds = enrollments.map(e => e.course);
    
    const assessments = await Assessment.find({ course: { $in: courseIds } })
      .populate('course', 'title')
      .sort({ dueDate: 1 })
      .lean();
      
    const submissions = await Submission.find({ student: studentId }).lean();
    
    // Map submissions onto assessments for the student's view
    const formatted = assessments.map(a => {
      const sub = submissions.find(s => s.assessment.toString() === a._id.toString());
      return {
        ...a,
        submission: sub || null,
        isSubmitted: !!sub,
      };
    });
      
    return { success: true, assignments: formatted };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function getStudentGrades(studentId) {
  try {
    const { Submission } = await getModels();
    const submissions = await Submission.find({ student: studentId, status: "graded" })
      .populate({
        path: 'assessment',
        populate: { path: 'course', select: 'title' }
      })
      .populate('gradedBy', 'fullName')
      .sort({ gradedAt: -1 })
      .lean();
      
    return { success: true, grades: submissions };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function submitAssignment(studentId, assessmentId, content) {
  try {
    const { Submission, Assessment } = await getModels();
    
    // Ensure not already submitted
    const existing = await Submission.findOne({ student: studentId, assessment: assessmentId });
    if (existing) {
      return { success: false, message: "Already submitted." };
    }
    
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return { success: false, message: "Assessment not found." };
    
    const isLate = new Date() > new Date(assessment.dueDate);

    const submission = new Submission({
      student: studentId,
      assessment: assessmentId,
      content,
      status: "submitted",
      isLate
    });
    
    await submission.save();
    
    // Increment submission count on assessment
    await Assessment.findByIdAndUpdate(assessmentId, { $inc: { submissionsCount: 1 } });
    
    return { success: true, submission };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function updateStudentProfile(studentId, data) {
  try {
    const { Student } = await getModels();
    const updated = await Student.findByIdAndUpdate(
      studentId,
      { $set: data },
      { new: true }
    ).select('-password');
    return { success: true, student: updated };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
