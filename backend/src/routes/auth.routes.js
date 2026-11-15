import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../middleware/authenticate.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { ApiError } from '../middleware/ApiError.js'
import { validate } from '../middleware/validate.js'
import { login, logout, currentUser, register } from '../controllers/auth.controller.js'
import { loginSchema, registerSchema } from '../validation/auth.validation.js'

const router = Router()
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, _response, next) =>
    next(new ApiError(429, 'RATE_LIMITED', 'Too many authentication attempts. Try again later.')),
})

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(register))
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(login))
router.post('/logout', authenticate, asyncHandler(logout))
router.get('/me', authenticate, asyncHandler(currentUser))

export default router
