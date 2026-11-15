import { CreditEvent, User } from '../models/index.js'
import { ApiError } from '../middleware/ApiError.js'
import { sendSuccess } from '../utils/response.js'

function standingFor(score) {
  if (score >= 80) return 'Great standing'
  if (score >= 60) return 'Building trust'
  return 'Needs attention'
}

export async function getMyReputation(request, response) {
  const user = await User.findById(request.user.id).select('creditScore rewardPoints')
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.')
  return sendSuccess(response, {
    creditScore: user.creditScore,
    standing: standingFor(user.creditScore),
    rewardPoints: user.rewardPoints,
    rulesStatus: 'provisional',
  })
}

export async function listCreditEvents(request, response) {
  const events = await CreditEvent.find({ recipient: request.user.id })
    .sort({ createdAt: -1 })
    .limit(100)
  return sendSuccess(response, { events })
}
