import jwt from 'jsonwebtoken'
import { asyncHandler } from './asyncHandler.js'
import { ApiError } from './ApiError.js'
import { SESSION_COOKIE } from '../config/auth.js'
import { User } from '../models/index.js'

export const authenticate = asyncHandler(async (request, _response, next) => {
  const token = request.cookies?.[SESSION_COOKIE]
  if (!token) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in to continue.')
  }

  let claims
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Your session has expired.')
  }

  if (
    typeof claims !== 'object' ||
    typeof claims.sub !== 'string' ||
    !Number.isInteger(claims.version)
  ) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Your session is invalid.')
  }

  const user = await User.findById(claims.sub).select('+tokenVersion')
  if (!user || user.tokenVersion !== claims.version) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Your session is no longer valid.')
  }

  request.user = user
  next()
})

export function requireRole(...roles) {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'You do not have permission to do that.'))
    }
    next()
  }
}
