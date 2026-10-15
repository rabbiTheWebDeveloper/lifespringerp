import mongoose, { Schema } from "mongoose";

/**
 * OnlinePaymentModel - Strictly stores confirmed PAID payment records.
 * Unpaid, pending, cancelled, or failed attempts are not persisted.
 */
const onlinePaymentSchema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "BDT",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    studentId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      default: "Educational Fee / Services",
      trim: true,
    },
    status: {
      type: String,
      enum: ["completed"],
      default: "completed",
      index: true,
    },
    valId: {
      type: String,
      default: "",
    },
    bankTranId: {
      type: String,
      default: "",
    },
    cardType: {
      type: String,
      default: "",
    },
    cardBrand: {
      type: String,
      default: "",
    },
    cardIssuer: {
      type: String,
      default: "",
    },
    cardNo: {
      type: String,
      default: "",
    },
    sessionKey: {
      type: String,
      default: "",
    },
    rawGatewayResponse: {
      type: Schema.Types.Mixed,
      default: null,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

onlinePaymentSchema.index({ createdAt: -1 });

export const OnlinePaymentModel =
  mongoose.models.OnlinePayment ||
  mongoose.model("OnlinePayment", onlinePaymentSchema);
