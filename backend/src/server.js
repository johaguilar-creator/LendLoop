import 'dotenv/config'
import app from './app.js'
import { connectDatabase } from './config/database.js'

const port = Number(process.env.PORT || 5000)
const jwtSecret = process.env.JWT_SECRET

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
}
if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.startsWith('replace_me_')) {
  throw new Error('Set JWT_SECRET to a random value of at least 32 characters.')
}

try {
  await connectDatabase(process.env.MONGODB_URI)
  app.listen(port, () => {
    console.log(`LendLoop API listening on port ${port}.`)
  })
} catch (error) {
  console.error('Failed to start the LendLoop API:', error)
  process.exitCode = 1
}
