import { Notification, RewardEvent, User } from '../models/index.js'
import { ApiError } from '../middleware/ApiError.js'

export const ON_TIME_RETURN_POINTS = 50

export function pointsForReturn(onTime) {
  return onTime ? ON_TIME_RETURN_POINTS : 0
}

export async function recordReturnRewardEvent(loan, session) {
  const points = pointsForReturn(loan.returnedAt <= loan.dueAt)
  if (points === 0) return null

  const eventKey = `loan:${loan.id}:on-time-reward`
  const existing = await RewardEvent.findOne({ eventKey }).session(session)
  if (existing) return existing

  const user = await User.findById(loan.borrower).session(session)
  if (!user) throw new ApiError(404, 'BORROWER_NOT_FOUND', 'Borrower account not found.')
  user.rewardPoints += points
  await user.save({ session })

  const [event] = await RewardEvent.create(
    [
      {
        recipient: user.id,
        eventKey,
        type: 'on_time_return',
        points,
        description: 'On-time loan return',
        loan: loan.id,
      },
    ],
    { session },
  )
  await Notification.create(
    [
      {
        recipient: user.id,
        type: 'reward',
        title: 'You earned Loop Points',
        message: `You earned ${points} points for returning an item on time.`,
        resourceType: 'loan',
        resourceId: loan.id,
      },
    ],
    { session },
  )
  return event
}
