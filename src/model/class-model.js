import mongoose, { Schema } from "mongoose";

/**
 * ClassSession Model
 *
 * Session lifecycle:
 *   scheduled  → teacher created it, waiting to start
 *   in-progress → teacher clicked "Start Class" (startedAt set)
 *   completed  → teacher clicked "End Class"   (endedAt set, actualDuration computed)
 *   cancelled  → removed before it started
 */
const classSessionSchema = new Schema(
  {
    classId: { type: String, unique: true, index: true },

    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    course:  { type: Schema.Types.ObjectId, ref: "Course",  required: true, index: true },

    // Scheduled day/time (HH:MM 24h)
    dayOfWeek: {
      type: String,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      required: true,
    },
    startTime: { type: String, required: true },  // "HH:MM" — scheduled start
    endTime:   { type: String, required: true },  // "HH:MM" — scheduled end (startTime + 45 min)

    // Class Type (Regular Class, Retake Class, Make-up Class)
 classType: {
  type: String,
  enum: ["regular", "retake", "makeup"],
  default: "regular",
  index: true,
},

    // Duration in minutes — set by teacher when scheduling (15–180 min, default 45)
    duration: { type: Number, default: 45 },

    // Lifecycle status
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled", "paused"],
      default: "scheduled",
      index: true,
    },

    // Actual session timestamps (set when teacher starts/ends)
    startedAt:      { type: Date, default: null },  // when teacher clicked "Start"
    endedAt:        { type: Date, default: null },  // when teacher clicked "End"
    actualDuration: { type: Number, default: null }, // real minutes the class ran

    // Student attendance for this session (marked when teacher ends the class)
    studentAttendance: {
      type: String,
      enum: ["present", "absent", "not-marked"],
      default: "not-marked",
      index: true,
    },

    notes: { type: String, default: "", trim: true },
    meetLink: { type: String, default: null },
    topic: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

// Auto-generate classId before save — O(1) collision-free generation (no blocking network while-loops)
classSessionSchema.pre("save", async function () {
  if (!this.classId) {
    const now = new Date();
    const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    const rand = Math.floor(100 + Math.random() * 900);
    this.classId = `CLS-${datePart}${timePart}${rand}`;
  }
});

// Single-field & compound indexes for high-speed queries
classSessionSchema.index({ teacher: 1, status: 1, createdAt: -1 });
classSessionSchema.index({ teacher: 1, createdAt: -1 });
classSessionSchema.index({ teacher: 1, dayOfWeek: 1, status: 1 });
classSessionSchema.index({ student: 1, status: 1, createdAt: -1 });
classSessionSchema.index({ teacher: 1, dayOfWeek: 1, startTime: 1 });
classSessionSchema.index({ teacher: 1, studentAttendance: 1 });
classSessionSchema.index({ student: 1, dayOfWeek: 1 });
classSessionSchema.index({ createdAt: -1 });

if (mongoose.models.ClassSession) {
  delete mongoose.models.ClassSession;
}

export const ClassSessionModel = mongoose.model("ClassSession", classSessionSchema);
