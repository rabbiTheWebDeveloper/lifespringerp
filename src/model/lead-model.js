import mongoose, { Schema } from "mongoose";
import "@/model/user-model";

const LeadSchema = new Schema(
  {
    clientNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    clientName: {
      type: String,
      trim: true,
      default: '',
    },

    leadSource: {
      type: String,
      enum: ['whatsapp', 'facebook', 'other'],
      default: 'other',
      index: true,
    },

    crmInChargeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    leadAddedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    status: {
      type: String,
      enum: [
        'new lead',
        'processing',
        'trial',
        'follow up',
        'important',
        'admission done',
        'rejected',
        'cancelled',
        'not interested',
        'other',
      ],
      default: 'new lead',
      index: true,
    },

    country: {
      type: String,
      trim: true,
      default: '',
    },

    address: {
      type: String,
      trim: true,
      default: '',
    },

    feesNegotiation: {
      type: String,
      trim: true,
      default: '',
    },

    trialClassDate: {
      type: Date,
      default: null,
    },

    // Latest follow-up information
    lastFollowUpAt: {
      type: Date,
      default: null,
      index: true,
    },

    lastFollowUpBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    lastUpdateBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    lastUpdatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Useful for quickly showing number of interactions
    followUpCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// CRM dashboard
LeadSchema.index({
  crmInChargeId: 1,
  status: 1,
});

// Recent leads for an agent
LeadSchema.index({
  crmInChargeId: 1,
  lastUpdatedAt: -1,
});

// Status dashboard
LeadSchema.index({
  status: 1,
  lastUpdatedAt: -1,
});

// Source + status reporting
LeadSchema.index({
  leadSource: 1,
  status: 1,
});

export const LeadModel =
  mongoose.models.Lead ?? mongoose.model('Lead', LeadSchema);

export default LeadModel;