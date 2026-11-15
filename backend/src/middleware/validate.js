import { ApiError } from './ApiError.js'

export function validate(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query,
    })

    if (!result.success) {
      return next(
        new ApiError(
          400,
          'VALIDATION_ERROR',
          'Request validation failed.',
          result.error.flatten(),
        ),
      )
    }

    request.validated = result.data
    next()
  }
}
