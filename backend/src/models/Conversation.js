import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: (participants) =>
          participants.length === 2 &&
          participants[0].toString() !== participants[1].toString(),
        message: 'A conversation must have two distinct participants.',
      },
    },
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      default: null,
      unique: true,
      sparse: true,
    },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true },
)

conversationSchema.index({ participants: 1, lastMessageAt: -1 })

export default mongoose.models.Conversation ||
  mongoose.model('Conversation', conversationSchema)
