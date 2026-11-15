import mongoose from 'mongoose'

const adnuEmailPattern = /^[^\s@]+@adnu\.edu\.ph$/i

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [adnuEmailPattern, 'Use an @adnu.edu.ph email address.'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    studentId: {
      type: String,
      trim: true,
      maxlength: 40,
      sparse: true,
      unique: true,
    },
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
      required: true,
    },
    creditScore: { type: Number, min: 0, max: 100, default: 100 },
    rewardPoints: { type: Number, min: 0, default: 0 },
    activeBorrowingCount: { type: Number, min: 0, default: 0 },
    tokenVersion: { type: Number, min: 0, default: 0, select: false },
  },
  { timestamps: true },
)

userSchema.index({ role: 1, createdAt: -1 })

export default mongoose.models.User || mongoose.model('User', userSchema)
