import mongoose, { Schema } from "mongoose";

/**
 * Task Model — Optimized for high-throughput, low-memory, and fast query execution.
 * Designed for Fajr Academy ERP.
 */

const subtaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: { type: String, default: "" },
  },
  { _id: true, timestamps: false }
);

const commentSchema = new Schema(
  {
    userId: { type: Schema.Types.Mixed },
    userName: { type: String, required: true, trim: true },
    userRole: { type: String, default: "" },
    userAvatar: { type: String, default: "" },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["comment", "status_change", "assignment_change", "system"],
      default: "comment",
    },
  },
  { _id: true, timestamps: true }
);

const attachmentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: true, timestamps: false }
);

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "under_review", "completed", "cancelled"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    category: {
      type: String,
      enum: ["operations", "sales", "academic", "support", "finance", "technical", "general"],
      default: "general",
      index: true,
    },

    // ── Primary Assignee Snapshot (Extremely fast retrieval, no populate overhead) ──
    assignedTo: {
      userId: {
        type: Schema.Types.Mixed,
        required: [true, "Assignee is required"],
        index: true,
      },
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true, index: true },
      role: { type: String, default: "" },
      avatar: { type: String, default: "" },
      department: { type: String, default: "" },
    },

    // ── Creator / Delegator ──
    assignedBy: {
      userId: {
        type: Schema.Types.Mixed,
        required: true,
        index: true,
      },
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      role: { type: String, default: "" },
      avatar: { type: String, default: "" },
    },

    // ── Timing & Performance ──
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Subtasks / Checklist ──
    subtasks: [subtaskSchema],

    // ── Discussion & Progress Log ──
    comments: [commentSchema],

    // ── File Attachments ──
    attachments: [attachmentSchema],

    // ── Tags ──
    tags: [{ type: String, trim: true }],

    // ── Email Notification Status ──
    emailNotificationSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailRecipient: {
      type: String,
      default: "",
    },
    emailError: {
      type: String,
      default: "",
    },

    // ── Archived Flag ──
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Highly Optimized Compound Indexes (ESR: Equality, Sort, Range) ──
taskSchema.index({ isArchived: 1, "assignedTo.userId": 1, status: 1, dueDate: 1 });
taskSchema.index({ isArchived: 1, "assignedTo.email": 1, status: 1 });
taskSchema.index({ isArchived: 1, "assignedBy.userId": 1, createdAt: -1 });
taskSchema.index({ isArchived: 1, status: 1, priority: 1, createdAt: -1 });
taskSchema.index({ isArchived: 1, category: 1, status: 1, createdAt: -1 });
taskSchema.index({ isArchived: 1, dueDate: 1, status: 1 });
taskSchema.index({ isArchived: 1, createdAt: -1 });

// Text index for instant keyword search across title & description
taskSchema.index(
  { title: "text", description: "text" },
  { weights: { title: 5, description: 1 }, background: true }
);

export const TaskModel =
  mongoose.models.Task ?? mongoose.model("Task", taskSchema);
