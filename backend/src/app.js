import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import healthRouter from './routes/health.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8443',
    credentials: true,
  }),
)
app.use(express.json())
app.use('/api/health', healthRouter)
app.use(notFoundHandler)
app.use(errorHandler)

export default app
