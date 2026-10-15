import { dbConnect } from "@/service/mongo";
import { StudentModel } from "@/model/student-model";
import { EnrollmentModel } from "@/model/enrollment-model";
import { CourseModel } from "@/model/course-model";
import { TeacherModel } from "@/model/teacher-model";
import { UserModel } from "@/model/user-model";
import { escapeRegex } from "@/lib/utils";


const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

function createDayRange(year, monthIndex, day) {
  // Day range safe across any timezone from UTC-14 to UTC+14 (covers BST UTC+6 and UTC)
  const start = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0) - 14 * 3600 * 1000);
  const end = new Date(Date.UTC(year, monthIndex, day, 23, 59, 59, 999) + 14 * 3600 * 1000);
  return { start, end };
}

function createMonthRange(year, monthIndex) {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0) - 14 * 3600 * 1000);
  const end = new Date(Date.UTC(year, monthIndex, lastDay, 23, 59, 59, 999) + 14 * 3600 * 1000);
  return { start, end };
}

function createYearRange(year) {
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0) - 14 * 3600 * 1000);
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999) + 14 * 3600 * 1000);
  return { start, end };
}

/**
 * Parses user search query to extract potential date ranges (single day, full month, or year)
 * Supports: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Month Names ("26 July 2026", "July 26 2026", "July 2026"), etc.
 */
export function extractDateSearchRanges(search) {
  if (!search) return [];
  const text = String(search).trim();
  const ranges = [];

  // 1. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = text.match(/\b(\d{4})\s*[-/.]\s*(0?[1-9]|1[0-2])\s*[-/.]\s*(0?[1-9]|[12]\d|3[01])\b/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    if (y >= 2000 && y <= 2050 && d >= 1 && d <= 31) {
      ranges.push(createDayRange(y, m, d));
    }
  }

  // 2. DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = text.match(/\b(0?[1-9]|[12]\d|3[01])\s*[-/.]\s*(0?[1-9]|1[0-2])\s*[-/.]\s*(\d{4})\b/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (y >= 2000 && y <= 2050) {
      // Standard DD-MM-YYYY
      ranges.push(createDayRange(y, p2 - 1, p1));
      // Ambiguous DD/MM vs MM/DD: if p1 <= 12 and p1 !== p2, include alternative too
      if (p1 <= 12 && p1 !== p2) {
        ranges.push(createDayRange(y, p1 - 1, p2));
      }
    }
  }

  // 3. Month Name Day, Year (e.g. "July 26, 2026", "Jul 26 2026")
  const mdyNamedMatch = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s,.-]+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?[\s,.-]+(\d{4})\b/i);
  if (mdyNamedMatch) {
    const mStr = mdyNamedMatch[1].toLowerCase();
    const d = parseInt(mdyNamedMatch[2], 10);
    const y = parseInt(mdyNamedMatch[3], 10);
    if (MONTH_MAP[mStr] !== undefined && y >= 2000 && y <= 2050) {
      ranges.push(createDayRange(y, MONTH_MAP[mStr], d));
    }
  }

  // 4. Day Month Name Year (e.g. "26 July 2026", "26th July 2026", "26-Jul-2026")
  const dmyNamedMatch = text.match(/\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?[\s,.-]+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s,.-]+(\d{4})\b/i);
  if (dmyNamedMatch) {
    const d = parseInt(dmyNamedMatch[1], 10);
    const mStr = dmyNamedMatch[2].toLowerCase();
    const y = parseInt(dmyNamedMatch[3], 10);
    if (MONTH_MAP[mStr] !== undefined && y >= 2000 && y <= 2050) {
      ranges.push(createDayRange(y, MONTH_MAP[mStr], d));
    }
  }

  // 5. Month Name and Year only (e.g. "July 2026", "Jul 2026")
  if (ranges.length === 0) {
    const myNamedMatch = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s,.-]+(\d{4})\b/i);
    if (myNamedMatch) {
      const mStr = myNamedMatch[1].toLowerCase();
      const y = parseInt(myNamedMatch[2], 10);
      if (MONTH_MAP[mStr] !== undefined && y >= 2000 && y <= 2050) {
        ranges.push(createMonthRange(y, MONTH_MAP[mStr]));
      }
    }
  }

  // 6. YYYY-MM or MM-YYYY (e.g. "2026-07", "07-2026", "07/2026")
  if (ranges.length === 0) {
    const ymMatch = text.match(/^(\d{4})\s*[-/.]\s*(0?[1-9]|1[0-2])$/);
    if (ymMatch) {
      const y = parseInt(ymMatch[1], 10);
      const m = parseInt(ymMatch[2], 10) - 1;
      if (y >= 2000 && y <= 2050) {
        ranges.push(createMonthRange(y, m));
      }
    }
    const myNumMatch = text.match(/^(0?[1-9]|1[0-2])\s*[-/.]\s*(\d{4})$/);
    if (myNumMatch) {
      const m = parseInt(myNumMatch[1], 10) - 1;
      const y = parseInt(myNumMatch[2], 10);
      if (y >= 2000 && y <= 2050) {
        ranges.push(createMonthRange(y, m));
      }
    }
  }

  // 7. Day and Month without year: e.g. "26 July", "July 26", "26.07"
  if (ranges.length === 0) {
    const dmNamedMatch = text.match(/^(?:(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?[\s,.-]+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s,.-]+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?)$/i);
    if (dmNamedMatch) {
      const d = parseInt(dmNamedMatch[1] || dmNamedMatch[4], 10);
      const mStr = (dmNamedMatch[2] || dmNamedMatch[3]).toLowerCase();
      const m = MONTH_MAP[mStr];
      if (m !== undefined) {
        const currentYear = new Date().getFullYear();
        ranges.push(createDayRange(currentYear, m, d));
        ranges.push(createDayRange(currentYear - 1, m, d));
      }
    } else {
      const dmDotMatch = text.match(/^(0?[1-9]|[12]\d|3[01])\s*[-/.]\s*(0?[1-9]|1[0-2])$/);
      if (dmDotMatch) {
        const d = parseInt(dmDotMatch[1], 10);
        const m = parseInt(dmDotMatch[2], 10) - 1;
        const currentYear = new Date().getFullYear();
        ranges.push(createDayRange(currentYear, m, d));
        ranges.push(createDayRange(currentYear - 1, m, d));
      }
    }
  }

  // 8. Standalone Year (e.g. "2024", "2025", "2026")
  if (ranges.length === 0) {
    const yearMatch = text.match(/^(20[2-3]\d)$/);
    if (yearMatch) {
      const y = parseInt(yearMatch[1], 10);
      ranges.push(createYearRange(y));
    }
  }

  return ranges;
}

/**
 * Builds flexible regex patterns for phone numbers in any style or format
 * (matching variations in spaces, dashes, parentheses, dots, country codes +880, 880, leading 0, etc.)
 */
export function buildPhoneSearchPatterns(search) {
  if (!search) return [];
  const clean = String(search).trim();
  const digitsOnly = clean.replace(/\D/g, "");
  if (!digitsOnly || digitsOnly.length < 3) return [];

  const digitVariants = new Set();
  digitVariants.add(digitsOnly);

  if (/^01[3-9]\d{8}$/.test(digitsOnly)) {
    // Standard Bangladesh 11-digit mobile: 017xxxxxxxx
    digitVariants.add(digitsOnly); // 017xxxxxxxx
    digitVariants.add(digitsOnly.slice(1)); // 17xxxxxxxx (without leading 0)
    digitVariants.add(`88${digitsOnly}`); // 88017xxxxxxxx
    digitVariants.add(`880${digitsOnly.slice(1)}`); // 88017xxxxxxxx
  } else if (/^8801[3-9]\d{8}$/.test(digitsOnly)) {
    // Bangladesh with 880: 88017xxxxxxxx
    digitVariants.add(digitsOnly); // 88017xxxxxxxx
    digitVariants.add(digitsOnly.slice(2)); // 017xxxxxxxx (with leading 0)
    digitVariants.add(digitsOnly.slice(3)); // 17xxxxxxxx (without leading 0)
  } else if (/^1[3-9]\d{8}$/.test(digitsOnly)) {
    // 10-digit without leading zero: 17xxxxxxxx
    digitVariants.add(digitsOnly); // 17xxxxxxxx
    digitVariants.add(`0${digitsOnly}`); // 017xxxxxxxx
    digitVariants.add(`880${digitsOnly}`); // 88017xxxxxxxx
  } else {
    // General international prefix handling
    if (digitsOnly.startsWith("880") && digitsOnly.length > 5) {
      digitVariants.add(digitsOnly.slice(2)); // with 0
      digitVariants.add(digitsOnly.slice(3)); // without 0
    } else if (digitsOnly.startsWith("0") && digitsOnly.length >= 4) {
      digitVariants.add(digitsOnly.slice(1));
      digitVariants.add(`880${digitsOnly.slice(1)}`);
    } else if (digitsOnly.length >= 10 && digitsOnly.startsWith("1")) {
      // US or Canada (+1)
      digitVariants.add(digitsOnly.slice(1));
    }
  }

  const patterns = [];
  for (const variant of digitVariants) {
    if (variant.length < 3) continue;
    // Allow optional non-digit separators (spaces, dashes, parens, dots, slashes) between digits
    const flexPattern = variant
      .split("")
      .map(escapeRegex)
      .join("[\\s\\-()./]*");
    patterns.push(`(?:\\+?[\\s\\-]*)?${flexPattern}`);
  }

  return patterns;
}

/**
 * Get paginated list of students with optional search and filters
 */
export async function getAllStudents({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  courseId = "",
  month = "",
  paymentStatus = "",
  teacherFilter = "",
  crmFilter = "",
  fromDate = "",
  toDate = "",
} = {}) {
  await dbConnect();
  const mongoose = (await import("mongoose")).default;

  const conditions = [];

  // Status Filter
  if (status && status !== "all") {
    conditions.push({ status });
  }

  // Course Filter
  if (courseId && mongoose.isValidObjectId(courseId)) {
    conditions.push({
      $or: [
        { course: new mongoose.Types.ObjectId(courseId) },
        { enrolledCourses: { $in: [new mongoose.Types.ObjectId(courseId)] } }
      ]
    });
  }

  // Date Wise Filtering strictly on student create date (createdAt)
  if (fromDate || toDate) {
    const dateQuery = {};
    if (fromDate) {
      const parts = String(fromDate).trim().split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        // Start of selected date in UTC considering Bangladesh timezone (UTC+6)
        dateQuery.$gte = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - 6 * 3600 * 1000);
      } else {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        dateQuery.$gte = from;
      }
    }
    if (toDate) {
      const parts = String(toDate).trim().split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        // End of selected date in UTC considering Bangladesh timezone (UTC+6)
        dateQuery.$lte = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - 6 * 3600 * 1000);
      } else {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
      }
    }
    conditions.push({ createdAt: dateQuery });
  }

  // Teacher Filter (assigned, unassigned, or specific Teacher ID)
  if (teacherFilter === "assigned") {
    conditions.push({ teacherId: { $ne: null } });
  } else if (teacherFilter === "unassigned") {
    conditions.push({ teacherId: null });
  } else if (teacherFilter && teacherFilter !== "all") {
    if (mongoose.isValidObjectId(teacherFilter)) {
      conditions.push({ teacherId: new mongoose.Types.ObjectId(teacherFilter) });
    } else {
      conditions.push({ teacherId: teacherFilter });
    }
  }

  // CRM Filter (assigned, unassigned, or specific CRM User ID)
  if (crmFilter === "assigned") {
    conditions.push({ crmRefId: { $nin: [null, ""] } });
  } else if (crmFilter === "unassigned") {
    conditions.push({ crmRefId: { $in: [null, ""] } });
  } else if (crmFilter && crmFilter !== "all") {
    conditions.push({ crmRefId: crmFilter });
  }

  // Payment Status Filter
  if (paymentStatus && paymentStatus !== "all") {
    const { PaymentModel } = await import("@/model/payment-model");
    const targetMonth = month || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    
    if (paymentStatus === "paid") {
      const paidPayments = await PaymentModel.find({
        month: targetMonth,
        status: "completed",
      }).select("student").lean();
      const paidStudentIds = paidPayments.map((p) => p.student?.toString()).filter(Boolean);
      conditions.push({ _id: { $in: paidStudentIds } });
    } else if (paymentStatus === "pending") {
      const pendingPayments = await PaymentModel.find({
        month: targetMonth,
        status: "pending",
      }).select("student").lean();
      const pendingStudentIds = pendingPayments.map((p) => p.student?.toString()).filter(Boolean);
      conditions.push({ _id: { $in: pendingStudentIds } });
    } else if (paymentStatus === "unpaid") {
      const paidOrPendingPayments = await PaymentModel.find({
        month: targetMonth,
        status: { $in: ["completed", "pending"] },
      }).select("student").lean();
      const paidOrPendingStudentIds = paidOrPendingPayments.map((p) => p.student?.toString()).filter(Boolean);
      conditions.push({ _id: { $nin: paidOrPendingStudentIds } });
    }
  }

  // Search Filter (by student info, phone variants in any format, date matching in any style, teacher name, or CRM name)
  if (search && search.trim()) {
    const cleanSearch = search.trim();
    const escaped = escapeRegex(cleanSearch);
    const searchRegex = { $regex: escaped, $options: "i" };

    // Also look up teachers and CRM users that match this search query
    const { TeacherModel } = await import("@/model/teacher-model");
    const { UserModel } = await import("@/model/user-model");

    let matchedTeacherIds = [];
    let matchedCrmUserIds = [];

    try {
      const [matchedTeachers, matchedCrmUsers] = await Promise.all([
        TeacherModel.find({
          $or: [
            { fullName: searchRegex },
            { teacherId: searchRegex }
          ]
        }).select("_id").lean(),
        UserModel.find({
          $or: [
            { fullName: searchRegex },
            { email: searchRegex }
          ]
        }).select("_id").lean()
      ]);
      matchedTeacherIds = matchedTeachers.map(t => t._id);
      matchedCrmUserIds = matchedCrmUsers.map(u => u._id.toString());
    } catch {
      // ignore lookup error
    }

    const orClauses = [
      { fullName: searchRegex },
      { fatherName: searchRegex },
      { motherName: searchRegex },
      { email: searchRegex },
      { studentId: searchRegex },
      { phone: searchRegex },
      { whatsappNumber: searchRegex },
      { crmRefId: searchRegex },
    ];

    // Phone search in ANY style/format (spaces, dashes, parentheses, dots, country codes +880, 880, local 01...)
    const phonePatterns = buildPhoneSearchPatterns(cleanSearch);
    for (const pat of phonePatterns) {
      try {
        new RegExp(pat, "i");
        orClauses.push({ phone: { $regex: pat, $options: "i" } });
        orClauses.push({ whatsappNumber: { $regex: pat, $options: "i" } });
      } catch (regexErr) {
        console.warn("Invalid phone regex skipped:", pat, regexErr);
      }
    }

    // Date search matching on student create date
    const dateRanges = extractDateSearchRanges(cleanSearch);
    for (const range of dateRanges) {
      orClauses.push({ createdAt: { $gte: range.start, $lte: range.end } });
    }

    if (matchedTeacherIds.length > 0) {
      orClauses.push({ teacherId: { $in: matchedTeacherIds } });
    }
    if (matchedCrmUserIds.length > 0) {
      orClauses.push({ crmRefId: { $in: matchedCrmUserIds } });
    }

    conditions.push({ $or: orClauses });
  }

  const query = conditions.length > 0 ? { $and: conditions } : {};

  const skip = (page - 1) * limit;
  const [students, total] = await Promise.all([
    StudentModel.find(query)
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StudentModel.countDocuments(query),
  ]);

  // Resolve teacher details and CRM (User) details safely
  const { TeacherModel } = await import("@/model/teacher-model");
  const { UserModel } = await import("@/model/user-model");

  const teacherIds = Array.from(
    new Set(
      students
        .map((s) => s.teacherId?.toString())
        .filter((id) => id && mongoose.isValidObjectId(id))
    )
  );

  const crmIds = Array.from(
    new Set(
      students
        .map((s) => s.crmRefId?.toString())
        .filter((id) => id && mongoose.isValidObjectId(id))
    )
  );

  let teachers = [];
  let crms = [];
  try {
    [teachers, crms] = await Promise.all([
      teacherIds.length > 0
        ? TeacherModel.find({ _id: { $in: teacherIds } }).select("fullName avatar").lean()
        : [],
      crmIds.length > 0
        ? UserModel.find({ _id: { $in: crmIds } }).select("fullName avatar").lean()
        : [],
    ]);
  } catch (err) {
    console.error("[getAllStudents] teacher/crm lookup error:", err);
  }

  const teacherMap = {};
  teachers.forEach((t) => {
    if (t._id) teacherMap[t._id.toString()] = { name: t.fullName, avatar: t.avatar || "" };
  });

  const crmMap = {};
  crms.forEach((c) => {
    if (c._id) crmMap[c._id.toString()] = { name: c.fullName, avatar: c.avatar || "" };
  });

  // Resolve payment details for the selected month safely
  const targetMonth = month || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const { PaymentModel } = await import("@/model/payment-model");
  const studentIdsList = students.map(s => s._id);
  
  const monthPayments = await PaymentModel.find({
    student: { $in: studentIdsList },
    month: targetMonth
  }).lean();

  const paymentMap = {};
  monthPayments.forEach((p) => {
    if (p.student) {
      paymentMap[p.student.toString()] = {
        status: p.status,
        amount: p.amount,
        createdAt: p.createdAt,
        paymentMethod: p.paymentMethod,
        mrNumber: p.mrNumber,
      };
    }
  });

  const enrichedStudents = students.map((s) => ({
    ...s,
    teacherInfo: s.teacherId ? (teacherMap[s.teacherId.toString()] || null) : null,
    crmInfo: s.crmRefId ? (crmMap[s.crmRefId.toString()] || null) : null,
    paymentInfo: paymentMap[s._id.toString()] || null,
  }));

  return {
    students: enrichedStudents,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Get a single student by ID with their enrollments
 */
export async function getStudentById(id) {
  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  if (!id || !mongoose.isValidObjectId(id)) return null;

  const student = await StudentModel.findById(id).lean();
  if (!student) return null;

  let teacherInfo = null;
  if (student.teacherId && mongoose.isValidObjectId(student.teacherId)) {
    try {
      const { TeacherModel } = await import("@/model/teacher-model");
      const teacher = await TeacherModel.findById(student.teacherId).select("fullName avatar").lean();
      if (teacher) {
        teacherInfo = {
          name: teacher.fullName,
          avatar: teacher.avatar || "",
        };
      }
    } catch { /* silent */ }
  }

  let crmInfo = null;
  if (student.crmRefId && mongoose.isValidObjectId(student.crmRefId)) {
    try {
      const { UserModel } = await import("@/model/user-model");
      const crm = await UserModel.findById(student.crmRefId).select("fullName avatar").lean();
      if (crm) {
        crmInfo = {
          name: crm.fullName,
          avatar: crm.avatar || "",
        };
      }
    } catch { /* silent */ }
  }

  let enrollments = [];
  try {
    enrollments = await EnrollmentModel.find({ student: id })
      .populate("course", "title category thumbnail status")
      .lean();
  } catch { /* silent */ }

  let enrichedTeacherHistory = Array.isArray(student.teacherHistory) ? [...student.teacherHistory] : [];
  try {
    const { TeacherModel } = await import("@/model/teacher-model");
    const tIds = enrichedTeacherHistory
      .map((h) => h.teacher?.toString())
      .filter((t) => t && mongoose.isValidObjectId(t));
    if (student.teacherId && mongoose.isValidObjectId(student.teacherId)) {
      tIds.push(student.teacherId.toString());
    }
    if (tIds.length > 0) {
      const tDocs = await TeacherModel.find({ _id: { $in: Array.from(new Set(tIds)) } })
        .select("fullName teacherId avatar")
        .lean();
      const tMap = {};
      tDocs.forEach((t) => {
        tMap[t._id.toString()] = t;
      });
      enrichedTeacherHistory = enrichedTeacherHistory.map((h) => {
        const doc = h.teacher ? tMap[h.teacher.toString()] : null;
        return {
          ...h,
          teacherName: doc?.fullName || h.teacherName || "",
          teacherIdCode: doc?.teacherId || h.teacherId || "",
          avatar: doc?.avatar || "",
          isActive:
            !h.unassignedAt &&
            student.teacherId &&
            student.teacherId.toString() === (h.teacher?.toString() || doc?._id?.toString()),
        };
      });
    }
  } catch { /* silent */ }

  return { ...student, teacherInfo, crmInfo, enrollments, teacherHistory: enrichedTeacherHistory };
}

/**
 * Create a new student
 */
export async function createStudent(data) {
  await dbConnect();
  if (data) {
    if (data.teacherId === "") data.teacherId = null;
    if (data.course === "") data.course = null;
  }
  const student = new StudentModel(data);
  await student.save();

  // If teacher is assigned on create, track initial history
  if (student.teacherId) {
    try {
      const { TeacherModel } = await import("@/model/teacher-model");
      const teacherDoc = await TeacherModel.findById(student.teacherId).select("fullName teacherId").lean();
      if (teacherDoc) {
        student.teacherHistory = [{
          teacher: teacherDoc._id,
          teacherName: teacherDoc.fullName || "",
          teacherId: teacherDoc.teacherId || "",
          assignedAt: student.classStartingDate || new Date(),
          note: "Assigned on admission",
        }];
        await student.save();
      }
    } catch (thErr) {
      console.error("Initial teacherHistory error in createStudent:", thErr);
    }
  }

  // If monthly fee is provided and > 0, generate a pending invoice in PaymentModel
  const monthlyAmount = Number(data?.monthlyFee || student.monthlyFee || 0);
  if (monthlyAmount > 0) {
    try {
      const { PaymentModel } = await import("@/model/payment-model");
      const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const existing = await PaymentModel.findOne({
        student: student._id,
        month: currentMonth,
        type: "monthly-fee",
        status: { $ne: "cancelled" },
      });

      if (!existing) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const pendingPayment = new PaymentModel({
          student: student._id,
          course: student.course || null,
          amount: monthlyAmount,
          currency: "BDT",
          type: "monthly-fee",
          status: "pending",
          paymentMethod: "other",
          month: currentMonth,
          dueDate: dueDate,
          notes: `Monthly tuition fee invoice for ${currentMonth}`,
        });

        await pendingPayment.save();
      }
    } catch (paymentErr) {
      console.error("Failed to auto-create monthly pending invoice in createStudent:", paymentErr);
    }
  }

  return student.toObject();
}

/**
 * Update a student by ID
 */
export async function updateStudent(id, data) {
  await dbConnect();
  if (data) {
    if (data.teacherId === "") data.teacherId = null;
    if (data.course === "") data.course = null;
    if (data.status) {
      if (data.status === "active") {
        data.isActive = true;
      } else if (
        data.status === "inactive" ||
        data.status === "suspended" ||
        data.status === "discontinue" ||
        data.status === "discontinued" ||
        data.status === "pause" ||
        data.status === "paused"
      ) {
        data.isActive = false;
      }
    }

    // Auto-track teacher assignment/unassignment history if teacherId changes
    if (data.teacherId !== undefined) {
      try {
        const currentStudent = await StudentModel.findById(id).select("teacherId teacherHistory classStartingDate createdAt").lean();
        const oldTeacherId = currentStudent?.teacherId?.toString() || null;
        const newTeacherId = data.teacherId ? data.teacherId.toString() : null;

        if (oldTeacherId !== newTeacherId) {
          const history = [...(currentStudent?.teacherHistory || [])];
          const now = new Date();
          const unassignDate = data.unassignedAt ? new Date(data.unassignedAt) : now;
          const assignDate = data.assignedAt ? new Date(data.assignedAt) : now;

          // Close old teacher entry
          if (oldTeacherId) {
            const prevEntry = history.slice().reverse().find(
              h => h.teacher?.toString() === oldTeacherId && !h.unassignedAt
            );
            if (prevEntry) {
              prevEntry.unassignedAt = unassignDate;
              if (data.unassignNote) prevEntry.note = data.unassignNote;
            }
          }

          // Add new teacher entry
          if (newTeacherId) {
            const { TeacherModel } = await import("@/model/teacher-model");
            const teacherDoc = await TeacherModel.findById(newTeacherId).select("fullName teacherId").lean();
            if (teacherDoc) {
              history.push({
                teacher: teacherDoc._id,
                teacherName: teacherDoc.fullName || "",
                teacherId: teacherDoc.teacherId || "",
                assignedAt: assignDate,
                note: data.assignNote || data.note || "",
              });
            }
          }

          data.teacherHistory = history;
        }
      } catch (thErr) {
        console.error("teacherHistory tracking error in updateStudent:", thErr);
      }
    }
  }

  const hasCustomTimestamps = Boolean(data?.createdAt || data?.updatedAt);
  const rawTimestamps = {};
  if (data?.createdAt) {
    const cDate = new Date(data.createdAt);
    if (!isNaN(cDate.getTime())) {
      rawTimestamps.createdAt = cDate;
      data.createdAt = cDate;
    }
  }
  if (data?.updatedAt) {
    const uDate = new Date(data.updatedAt);
    if (!isNaN(uDate.getTime())) {
      rawTimestamps.updatedAt = uDate;
      data.updatedAt = uDate;
    }
  }

  const updateOptions = { new: true, runValidators: true };
  if (hasCustomTimestamps) {
    updateOptions.timestamps = false;
  }

  const student = await StudentModel.findByIdAndUpdate(
    id,
    { $set: data },
    updateOptions
  ).lean();

  if (hasCustomTimestamps && Object.keys(rawTimestamps).length > 0) {
    try {
      const mongoose = (await import("mongoose")).default;
      const docId = typeof id === "string" && mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id;
      await StudentModel.collection.updateOne(
        { _id: docId },
        { $set: rawTimestamps }
      );
      if (student) {
        if (rawTimestamps.createdAt) student.createdAt = rawTimestamps.createdAt;
        if (rawTimestamps.updatedAt) student.updatedAt = rawTimestamps.updatedAt;
      }
    } catch (dbErr) {
      console.error("Direct timestamp update error in updateStudent:", dbErr);
    }
  }

  return student;
}

/**
 * Delete a student by ID
 */
export async function deleteStudent(id) {
  await dbConnect();
  await StudentModel.findByIdAndDelete(id);
  await EnrollmentModel.deleteMany({ student: id });
  try {
    const { ScheduleModel } = await import("@/model/schedule-model");
    await ScheduleModel.deleteMany({ student: id });
  } catch (e) {
    // ignore if schedule model cleanup fails
  }
  return { success: true };
}

/**
 * Get dashboard KPIs for students
 */
export async function getStudentDashboardStats() {
  await dbConnect();
  const [total, active, atRisk, completed] = await Promise.all([
    StudentModel.countDocuments(),
    StudentModel.countDocuments({ status: "active" }),
    StudentModel.countDocuments({ status: "at-risk" }),
    StudentModel.countDocuments({ status: "completed" }),
  ]);
  return { total, active, atRisk, completed };
}

/**
 * Get students flagged as at-risk
 */
export async function getStudentsAtRisk(limit = 5) {
  await dbConnect();
  return StudentModel.find({ status: "at-risk" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * Get recent students
 */
export async function getRecentStudents(limit = 5) {
  await dbConnect();
  return StudentModel.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
