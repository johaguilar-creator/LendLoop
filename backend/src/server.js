import 'dotenv/config'
import app from './app.js'
import { connectDatabase } from './config/database.js'

const port = Number(process.env.PORT || 5000)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
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
