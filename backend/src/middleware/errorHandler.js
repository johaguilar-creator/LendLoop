import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { ApiError } from './ApiError.js'

export function notFoundHandler(_request, _response, next) {
  next(new ApiError(404, 'NOT_FOUND', 'Route not found.'))
}

export function errorHandler(error, _request, response, next) {
  if (response.headersSent) return next(error)

  let apiError
  if (error instanceof ApiError) {
    apiError = error
  } else if (error instanceof ZodError) {
    apiError = new ApiError(
      400,
      'VALIDATION_ERROR',
      'Request validation failed.',
      error.flatten(),
    )
  } else if (error instanceof mongoose.Error.ValidationError) {
    apiError = new ApiError(
      400,
      'VALIDATION_ERROR',
      'Submitted data is invalid.',
      Object.fromEntries(
        Object.entries(error.errors).map(([field, issue]) => [
          field,
          issue.message,
        ]),
      ),
    )
  } else if (error instanceof mongoose.Error.CastError) {
    apiError = new ApiError(400, 'INVALID_ID', 'A supplied ID is invalid.')
  } else if (error?.code === 11000) {
    apiError = new ApiError(409, 'DUPLICATE_RESOURCE', 'That record already exists.')
  } else {
    apiError = new ApiError(
      Number.isInteger(error?.status) ? error.status : 500,
      error?.code || 'INTERNAL_SERVER_ERROR',
      Number.isInteger(error?.status)
        ? error.message
        : 'An unexpected error occurred.',
    )
  }

  if (apiError.status >= 500) {
    console.error(error)
  }

  response.status(apiError.status).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  })
}
