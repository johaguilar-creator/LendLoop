import mongoose from 'mongoose'

const creditEventSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventKey: { type: String, required: true, unique: true },
    reason: {
      type: String,
      enum: ['on_time_return', 'late_return'],
      required: true,
    },
    delta: { type: Number, required: true, min: -100, max: 100 },
    scoreAfter: { type: Number, required: true, min: 0, max: 100 },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

creditEventSchema.index({ recipient: 1, createdAt: -1 })

export default mongoose.models.CreditEvent ||
  mongoose.model('CreditEvent', creditEventSchema)
