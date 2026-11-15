import { CreditEvent, User } from '../models/index.js'
import { ApiError } from '../middleware/ApiError.js'

export function calculateCreditScoreAdjustment(currentScore, onTime) {
  const requestedDelta = onTime ? 2 : -10
  const scoreAfter = Math.min(100, Math.max(0, currentScore + requestedDelta))
  return {
    delta: scoreAfter - currentScore,
    scoreAfter,
  }
}

export async function recordReturnCreditEvent(loan, session) {
  const eventKey = `loan:${loan.id}:credit`
  const existing = await CreditEvent.findOne({ eventKey }).session(session)
  if (existing) return existing

  const user = await User.findById(loan.borrower).session(session)
  if (!user) throw new ApiError(404, 'BORROWER_NOT_FOUND', 'Borrower account not found.')

  const onTime = loan.returnedAt <= loan.dueAt
  const reason = onTime ? 'on_time_return' : 'late_return'
  const { delta, scoreAfter } = calculateCreditScoreAdjustment(
    user.creditScore,
    onTime,
  )

  user.creditScore = scoreAfter
  await user.save({ session })
  const [event] = await CreditEvent.create(
    [
      {
        recipient: user.id,
        eventKey,
        reason,
        delta,
        scoreAfter,
        loan: loan.id,
      },
    ],
    { session },
  )
  return event
}
