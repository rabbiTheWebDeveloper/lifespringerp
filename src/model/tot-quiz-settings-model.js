import mongoose from "mongoose";

const TotQuizSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "tot-final-round",
      index: true,
    },
    title: {
      type: String,
      default: "শিক্ষকদের জন্য মৌলিক কুরআনিক জ্ঞান ও তাজবিদ — TOT Final Round",
    },
    isResultPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    publishedBy: {
      type: String,
      default: "",
    },
    publishNotice: {
      type: String,
      default: "ফলাফল সন্ধ্যা ৬:০০ টায় প্রকাশিত হয়েছে।",
    },
  },
  { timestamps: true }
);

export const TotQuizSettingsModel =
  mongoose.models.TotQuizSettings ||
  mongoose.model("TotQuizSettings", TotQuizSettingsSchema);
