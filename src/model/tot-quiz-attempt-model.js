import mongoose, { Schema } from "mongoose";

/**
 * One document per participant (unique WhatsApp number) for the TOT Final Round quiz.
 * Answers are stored as { [questionId]: originalOptionIndex } so grading is independent
 * of the per-attempt shuffled display order.
 */
const totQuizAttemptSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    whatsapp: { type: String, required: true, unique: true, index: true }, // normalized digits, e.g. 8801XXXXXXXXX
    whatsappRaw: { type: String, default: "" },

    // Secret returned to the participant's browser; required for every follow-up call
    token: { type: String, required: true, select: false },

    status: { type: String, enum: ["in-progress", "submitted"], default: "in-progress", index: true },

    // Per-attempt randomisation (question ids, and option permutation per question id)
    questionOrder: [{ type: Number }],
    optionOrder: { type: Map, of: [Number], default: {} },

    // Selected answers keyed by question id → original option index (0-3)
    answers: { type: Map, of: Number, default: {} },

    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    submitReason: { type: String, enum: ["manual", "timeout", "expired", null], default: null },
    timeTakenSec: { type: Number, default: 0 },

    // Grading (filled on submit)
    total: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    unanswered: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },

    // Integrity signals
    violations: {
      tabSwitch: { type: Number, default: 0 },
      copyPaste: { type: Number, default: 0 },
      screenshot: { type: Number, default: 0 },
      contextMenu: { type: Number, default: 0 },
      devtools: { type: Number, default: 0 },
    },
    resumeCount: { type: Number, default: 0 },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

totQuizAttemptSchema.index({ status: 1, percentage: -1, timeTakenSec: 1 });

export const TotQuizAttemptModel =
  mongoose.models.TotQuizAttempt ?? mongoose.model("TotQuizAttempt", totQuizAttemptSchema);
