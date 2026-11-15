import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import authRouter from './routes/auth.routes.js'
import healthRouter from './routes/health.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import itemRouter from './routes/item.routes.js'
import { borrowRequests, loans } from './routes/borrowing.routes.js'
import conversationRouter from './routes/conversation.routes.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8443',
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json())
app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/items', itemRouter)
app.use('/api/borrow-requests', borrowRequests)
app.use('/api/loans', loans)
app.use('/api/conversations', conversationRouter)
app.use(notFoundHandler)
app.use(errorHandler)

export default app
