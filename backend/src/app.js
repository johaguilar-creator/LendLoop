import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import healthRouter from './routes/health.routes.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:8443' }))
app.use(express.json())
app.use('/api/health', healthRouter)

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found.' },
  })
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(error.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.status ? error.message : 'An unexpected error occurred.',
    },
  })
})

export default app
