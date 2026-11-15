import mongoose from 'mongoose'

const rewardEventSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventKey: { type: String, required: true, unique: true },
    type: { type: String, enum: ['on_time_return'], required: true },
    points: { type: Number, required: true, min: 1 },
    description: { type: String, required: true, trim: true, maxlength: 240 },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

rewardEventSchema.index({ recipient: 1, createdAt: -1 })

export default mongoose.models.RewardEvent ||
  mongoose.model('RewardEvent', rewardEventSchema)
