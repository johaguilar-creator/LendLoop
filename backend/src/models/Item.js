import mongoose from 'mongoose'
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from './constants.js'

const itemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },
    category: { type: String, enum: ITEM_CATEGORIES, required: true },
    condition: { type: String, enum: ITEM_CONDITIONS, required: true },
    imageUrl: { type: String, trim: true, default: '' },
    available: { type: Boolean, default: true, index: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

itemSchema.index({ available: 1, category: 1, createdAt: -1 })
itemSchema.index({ title: 'text', description: 'text' })

export default mongoose.models.Item || mongoose.model('Item', itemSchema)
