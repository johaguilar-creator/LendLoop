import { RewardEvent, User } from '../models/index.js'
import { ApiError } from '../middleware/ApiError.js'
import { sendSuccess } from '../utils/response.js'

export async function getMyRewards(request, response) {
  const user = await User.findById(request.user.id).select('rewardPoints')
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.')
  return sendSuccess(response, { points: user.rewardPoints })
}

export async function listRewardEvents(request, response) {
  const events = await RewardEvent.find({ recipient: request.user.id })
    .sort({ createdAt: -1 })
    .limit(100)
  return sendSuccess(response, { events })
}
