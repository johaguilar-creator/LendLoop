import mongoose from 'mongoose'
import { LOAN_STATUSES } from './constants.js'

const loanSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BorrowRequest',
      required: true,
      unique: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
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
    startedAt: { type: Date, required: true },
    dueAt: { type: Date, required: true },
    returnedAt: { type: Date, default: null },
    status: { type: String, enum: LOAN_STATUSES, default: 'active' },
  },
  { timestamps: true },
)

loanSchema.index({ borrower: 1, status: 1, dueAt: 1 })
loanSchema.index({ owner: 1, status: 1, dueAt: 1 })

export default mongoose.models.Loan || mongoose.model('Loan', loanSchema)
