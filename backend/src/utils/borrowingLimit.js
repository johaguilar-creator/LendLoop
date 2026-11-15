import { MAX_ACTIVE_BORROWINGS } from '../models/constants.js'
import { ApiError } from '../middleware/ApiError.js'

export function assertBorrowingCapacity(activeCount) {
  if (activeCount >= MAX_ACTIVE_BORROWINGS) {
    throw new ApiError(
      409,
      'BORROWING_LIMIT_REACHED',
      `You may have at most ${MAX_ACTIVE_BORROWINGS} active borrowings.`,
      { limit: MAX_ACTIVE_BORROWINGS, activeCount },
    )
  }
}
