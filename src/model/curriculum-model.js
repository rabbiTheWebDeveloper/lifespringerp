import mongoose, { Schema } from "mongoose";

const lessonSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    classNumber: { type: String, default: "", trim: true },
    duration: { type: String, default: "" },
    type: {
      type: String,
      enum: ["lecture", "recitation", "exercise", "quiz", "reading"],
      default: "recitation",
    },
    topic: { type: String, default: "", trim: true },
    liveDrillType: { type: String, default: "Live Drill", trim: true },
    liveDrill: { type: String, default: "", trim: true },
    portalTask: { type: String, default: "", trim: true },
    teacherCheckmark: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    resourceLink: { type: String, default: "", trim: true },
    isFreePreview: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false, strict: false }
);

const moduleSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    phaseNumber: { type: String, default: "", trim: true },
    classRange: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    duration: { type: String, default: "" },
    hasTwoAssessments: { type: Boolean, default: true },
    formativeAssessment: { type: String, default: "", trim: true },
    summativeAssessment: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
    lessons: { type: [lessonSchema], default: [] },
  },
  { _id: false, strict: false }
);

const curriculumSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      unique: true,
      index: true,
    },
    courseId: {
      type: String,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    totalModules: {
      type: Number,
      default: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
    },
    modules: {
      type: [moduleSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

curriculumSchema.index({ course: 1 }, { unique: true });
curriculumSchema.index({ courseId: 1 });
curriculumSchema.index({ createdAt: -1 });

export const CurriculumModel =
  mongoose.models.Curriculum ?? mongoose.model("Curriculum", curriculumSchema);
