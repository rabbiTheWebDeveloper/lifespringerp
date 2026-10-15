import { dbConnect } from "@/service/mongo";
import { CourseModel } from "@/model/course-model";
import { CurriculumModel } from "@/model/curriculum-model";
import { EnrollmentModel } from "@/model/enrollment-model";
import { StudentModel } from "@/model/student-model";
import { escapeRegex } from "@/lib/utils";

/**
 * Get paginated list of courses with live assigned student count as enrolledCount
 */
export async function getAllCourses({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  simple = false,
  minimal = false,
} = {}) {
  await dbConnect();

  const query = {};
  if (status && status !== "all") query.status = status;
  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    query.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { courseId: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
    ];
  }

  const isMinimal = Boolean(simple || minimal);
  if (isMinimal) {
    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      CourseModel.find(query)
        .select("_id title courseId fee duration status category")
        .sort({ title: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CourseModel.countDocuments(query),
    ]);

    return {
      courses,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  const skip = (page - 1) * limit;
  const [courses, total] = await Promise.all([
    CourseModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CourseModel.countDocuments(query),
  ]);

  // Compute actual assigned student count and fetch curriculum for each course
  const courseIds = courses.map((c) => c._id);
  const [studentDocs, enrollmentDocs, curriculumDocs] = await Promise.all([
    StudentModel.find({
      $or: [
        { course: { $in: courseIds } },
        { enrolledCourses: { $in: courseIds } },
      ],
    }).select("_id course enrolledCourses").lean(),
    EnrollmentModel.find({ course: { $in: courseIds } }).select("course student").lean(),
    CurriculumModel.find({ course: { $in: courseIds } }).select("course modules totalModules totalLessons").lean(),
  ]);

  const courseStudentsMap = {};
  for (const c of courses) {
    courseStudentsMap[c._id.toString()] = new Set();
  }

  for (const s of studentDocs) {
    const sId = s._id.toString();
    if (s.course && courseStudentsMap[s.course.toString()]) {
      courseStudentsMap[s.course.toString()].add(sId);
    }
    if (Array.isArray(s.enrolledCourses)) {
      for (const enc of s.enrolledCourses) {
        if (enc && courseStudentsMap[enc.toString()]) {
          courseStudentsMap[enc.toString()].add(sId);
        }
      }
    }
  }

  for (const e of enrollmentDocs) {
    if (e.course && e.student && courseStudentsMap[e.course.toString()]) {
      courseStudentsMap[e.course.toString()].add(e.student.toString());
    }
  }

  const curriculumMap = {};
  for (const cur of curriculumDocs) {
    if (cur.course) {
      curriculumMap[cur.course.toString()] = cur.modules || [];
    }
  }

  // Attach accurate assigned student count as enrolledCount and curriculum
  const enrichedCourses = courses.map((c) => {
    const assignedCount = courseStudentsMap[c._id.toString()]?.size ?? 0;
    if (c.enrolledCount !== assignedCount) {
      CourseModel.findByIdAndUpdate(c._id, { $set: { enrolledCount: assignedCount } }).catch(() => {});
    }
    return {
      ...c,
      enrolledCount: assignedCount,
      curriculum: curriculumMap[c._id.toString()] || [],
    };
  });

  return {
    courses: enrichedCourses,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get a single course by ID with all assigned/enrolled students
 */
export async function getCourseById(id) {
  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const course = await CourseModel.findById(id).lean();
  if (!course) return null;

  const cId = typeof id === "string" && mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id;

  const [assignedStudents, rawEnrollments, curriculumDoc] = await Promise.all([
    StudentModel.find({
      $or: [
        { course: cId },
        { enrolledCourses: { $in: [cId] } },
      ],
    }).select("fullName studentId avatar status phone email admissionDate gender").lean(),
    EnrollmentModel.find({ course: cId })
      .populate("student", "fullName studentId avatar status phone email admissionDate gender")
      .lean(),
    CurriculumModel.findOne({ course: cId }).lean(),
  ]);

  const studentsMap = new Map();
  assignedStudents.forEach((s) => {
    studentsMap.set(s._id.toString(), {
      _id: s._id,
      student: s,
      enrolledAt: s.admissionDate || s.createdAt,
      status: s.status,
    });
  });

  rawEnrollments.forEach((e) => {
    if (e.student && !studentsMap.has(e.student._id?.toString())) {
      studentsMap.set(e.student._id.toString(), {
        _id: e.student._id,
        student: e.student,
        enrolledAt: e.createdAt || e.enrolledAt,
        status: e.student.status,
      });
    }
  });

  const enrollments = Array.from(studentsMap.values());
  const enrolledCount = enrollments.length;

  // Persist synced count in DB
  CourseModel.findByIdAndUpdate(id, { $set: { enrolledCount } }).catch(() => {});

  return { ...course, enrolledCount, enrollments, curriculum: curriculumDoc?.modules || [] };
}

/**
 * Create a new course
 */
export async function createCourse(data) {
  await dbConnect();
  // Only pick allowed fields from the new schema
  const { title, description, level, status, thumbnail, language, isActive, curriculum } = data;
  const course = new CourseModel({
    title,
    description,
    level,
    status,
    thumbnail,
    language,
    isActive,
    curriculum: Array.isArray(curriculum) ? curriculum : [],
  });
  await course.save();
  return course.toObject();
}

/**
 * Update a course by ID
 */
export async function updateCourse(id, data) {
  await dbConnect();
  // Only allow updating fields that exist in the new schema
  const allowedFields = ["title", "description", "level", "status", "thumbnail", "language", "isActive", "curriculum"];
  const update = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  const course = await CourseModel.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true }
  ).lean();
  return course;
}

/**
 * Delete a course by ID
 */
export async function deleteCourse(id) {
  await dbConnect();
  await CourseModel.findByIdAndDelete(id);
  await EnrollmentModel.deleteMany({ course: id });
  await CurriculumModel.deleteMany({ course: id });
  return { success: true };
}

/**
 * Enroll a student in a course
 */
export async function enrollStudentInCourse(studentId, courseId) {
  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const cId = typeof courseId === "string" && mongoose.isValidObjectId(courseId) ? new mongoose.Types.ObjectId(courseId) : courseId;
  const sId = typeof studentId === "string" && mongoose.isValidObjectId(studentId) ? new mongoose.Types.ObjectId(studentId) : studentId;

  const existing = await EnrollmentModel.findOne({ student: sId, course: cId });
  if (existing) return { error: "Student already enrolled in this course" };

  const enrollment = new EnrollmentModel({ student: sId, course: cId });
  await enrollment.save();

  // Set course on student if student.course is not yet set, and append to enrolledCourses
  const student = await StudentModel.findById(sId);
  const studentUpdates = {
    $addToSet: { enrolledCourses: enrollment._id },
  };
  if (student && !student.course) {
    studentUpdates.$set = { course: cId };
  }
  await StudentModel.findByIdAndUpdate(sId, studentUpdates);

  // Compute actual assigned student count and update CourseModel
  const [assignedStudents, enrollments] = await Promise.all([
    StudentModel.find({
      $or: [{ course: cId }, { enrolledCourses: { $in: [cId] } }],
    }).select("_id").lean(),
    EnrollmentModel.find({ course: cId }).select("student").lean(),
  ]);

  const uniqueStudentIds = new Set();
  assignedStudents.forEach((s) => uniqueStudentIds.add(s._id.toString()));
  enrollments.forEach((e) => {
    if (e.student) uniqueStudentIds.add(e.student.toString());
  });

  const enrolledCount = uniqueStudentIds.size;
  await CourseModel.findByIdAndUpdate(cId, { $set: { enrolledCount } });

  return enrollment.toObject();
}

/**
 * Synchronize all course enrolledCounts with actual assigned student counts in DB
 */
export async function syncAllCourseStudentCounts() {
  await dbConnect();
  const courses = await CourseModel.find({}).select("_id").lean();
  const courseIds = courses.map((c) => c._id);

  const [studentDocs, enrollmentDocs] = await Promise.all([
    StudentModel.find({
      $or: [
        { course: { $in: courseIds } },
        { enrolledCourses: { $in: courseIds } },
      ],
    }).select("_id course enrolledCourses").lean(),
    EnrollmentModel.find({ course: { $in: courseIds } }).select("course student").lean(),
  ]);

  const map = {};
  for (const c of courses) {
    map[c._id.toString()] = new Set();
  }

  for (const s of studentDocs) {
    const sId = s._id.toString();
    if (s.course && map[s.course.toString()]) {
      map[s.course.toString()].add(sId);
    }
    if (Array.isArray(s.enrolledCourses)) {
      for (const enc of s.enrolledCourses) {
        if (enc && map[enc.toString()]) {
          map[enc.toString()].add(sId);
        }
      }
    }
  }

  for (const e of enrollmentDocs) {
    if (e.course && e.student && map[e.course.toString()]) {
      map[e.course.toString()].add(e.student.toString());
    }
  }

  for (const c of courses) {
    const count = map[c._id.toString()]?.size ?? 0;
    await CourseModel.findByIdAndUpdate(c._id, { $set: { enrolledCount: count } });
  }

  return map;
}

/**
 * Get course dashboard stats
 */
export async function getCourseDashboardStats() {
  await dbConnect();
  const [total, published, draft] = await Promise.all([
    CourseModel.countDocuments(),
    CourseModel.countDocuments({ status: "published" }),
    CourseModel.countDocuments({ status: "draft" }),
  ]);
  return { total, published, draft };
}

