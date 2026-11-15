import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ApiError } from '../middleware/ApiError.js'
import {
  clearSessionCookieOptions,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '../config/auth.js'
import { User } from '../models/index.js'
import { sendSuccess } from '../utils/response.js'
import { serializeUser } from '../utils/serializeUser.js'

function createSessionToken(user) {
  return jwt.sign(
    { version: user.tokenVersion },
    process.env.JWT_SECRET,
    { subject: user.id, expiresIn: '7d' },
  )
}

function setSession(response, user) {
  response.cookie(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions())
}

export async function register(request, response) {
  const { name, email, password, studentId } = request.validated.body
  const passwordHash = await bcrypt.hash(password, 12)

  const user = await User.create({
    name,
    email,
    passwordHash,
    studentId,
    role: 'student',
  })

  setSession(response, user)
  return sendSuccess(response, { user: serializeUser(user) }, 201)
}

export async function login(request, response) {
  const { email, password } = request.validated.body
  const user = await User.findOne({ email }).select('+passwordHash +tokenVersion')
  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false

  if (!user || !passwordMatches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
  }

  setSession(response, user)
  return sendSuccess(response, { user: serializeUser(user) })
}

export async function logout(request, response) {
  await User.updateOne({ _id: request.user.id }, { $inc: { tokenVersion: 1 } })
  response.clearCookie(SESSION_COOKIE, clearSessionCookieOptions())
  return sendSuccess(response, { message: 'Signed out.' })
}

export async function currentUser(request, response) {
  return sendSuccess(response, { user: serializeUser(request.user) })
}
