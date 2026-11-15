import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import { User } from '../models/index.js'

const email = process.argv[2]?.trim().toLowerCase()
const allowlistedAdmins = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)

if (!email || !allowlistedAdmins.includes(email)) {
  throw new Error('Provide an existing email listed in ADMIN_EMAILS.')
}

try {
  await connectDatabase(process.env.MONGODB_URI)
  const result = await User.updateOne({ email }, { $set: { role: 'admin' } })
  if (result.matchedCount !== 1) {
    throw new Error(`No registered user found for ${email}.`)
  }
  console.log(`Administrator role granted to ${email}.`)
} finally {
  await mongoose.disconnect()
}
