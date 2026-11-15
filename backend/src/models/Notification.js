import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'borrow_request',
        'request_approved',
        'request_rejected',
        'loan_due',
        'loan_returned',
        'message',
        'report_update',
        'reward',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    resourceType: {
      type: String,
      enum: ['item', 'borrow_request', 'loan', 'conversation', 'report'],
      default: null,
    },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
)

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 })

export default mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema)
