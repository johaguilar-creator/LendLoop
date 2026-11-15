import mongoose from 'mongoose'
import { REPORT_CATEGORIES } from './constants.js'

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['item', 'user', 'loan'],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    category: { type: String, enum: REPORT_CATEGORIES, required: true },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: [
        'submitted',
        'under_review',
        'resolved',
        'dismissed',
        'referred_to_osa',
      ],
      default: 'submitted',
      required: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    internalNotes: { type: String, maxlength: 2000, default: '', select: false },
  },
  { timestamps: true },
)

reportSchema.index({ status: 1, createdAt: -1 })
reportSchema.index({ targetType: 1, targetId: 1 })

export default mongoose.models.Report || mongoose.model('Report', reportSchema)
