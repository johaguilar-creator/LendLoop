import { sendSuccess } from '../utils/response.js'
import { serializeUser } from '../utils/serializeUser.js'

export async function getMyProfile(request, response) {
  return sendSuccess(response, { user: serializeUser(request.user) })
}

export async function updateMyProfile(request, response) {
  const { name, bio, avatarUrl } = request.validated.body

  if (name !== undefined) request.user.name = name
  if (bio !== undefined) request.user.bio = bio
  if (avatarUrl !== undefined) request.user.avatarUrl = avatarUrl

  await request.user.save()
  return sendSuccess(response, { user: serializeUser(request.user) })
}
