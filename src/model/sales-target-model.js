import mongoose, { Schema } from "mongoose";
import "@/model/user-model";

const salesTargetSchema = new Schema(
  {
    targetType: {
      type: String,
      enum: ["organization", "user"],
      default: "organization",
      index: true,
    },
    // Assigned user (for specific sales executive or head of sales)
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // Target amounts in BDT (৳)
    daily: {
      type: Number,
      default: 0,
      min: 0,
    },
    // 15 days or custom target amount in BDT
    fifteenDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    custom: {
      type: Number,
      default: 0,
      min: 0,
    },
    from_date: {
      type: Date,
      default: null,
    },
    to_date: {
      type: Date,
      default: null,
    },
    monthly: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Key identifier e.g. "2026-10"
    month: {
      type: String,
      default: "",
      index: true,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique index per scope and month to prevent duplicates
salesTargetSchema.index({ targetType: 1, user: 1, month: 1, year: 1 });

export const SalesTargetModel =
  mongoose.models.SalesTarget ?? mongoose.model("SalesTarget", salesTargetSchema);
