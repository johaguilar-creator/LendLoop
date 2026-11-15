import mongoose from 'mongoose'
import { BORROW_REQUEST_STATUSES } from './constants.js'

const borrowRequestSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    proposedReturnDate: { type: Date, required: true },
    message: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: BORROW_REQUEST_STATUSES,
      default: 'pending',
      required: true,
    },
    decisionAt: { type: Date, default: null },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', default: null },
  },
  { timestamps: true },
)

borrowRequestSchema.index(
  { item: 1, borrower: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
)
borrowRequestSchema.index({ owner: 1, status: 1, createdAt: -1 })

export default mongoose.models.BorrowRequest ||
  mongoose.model('BorrowRequest', borrowRequestSchema)
