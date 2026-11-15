import { Notification } from '../models/index.js'
import { ApiError } from '../middleware/ApiError.js'
import { sendSuccess } from '../utils/response.js'

export async function listNotifications(request, response) {
  const { page, limit, unreadOnly } = request.validated.query
  const filter = { recipient: request.user.id }
  if (unreadOnly) filter.readAt = null

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: request.user.id, readAt: null }),
  ])
  return sendSuccess(response, {
    notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function markNotificationRead(request, response) {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: request.validated.params.notificationId,
      recipient: request.user.id,
    },
    { $set: { readAt: new Date() } },
    { new: true },
  )
  if (!notification) {
    throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.')
  }
  return sendSuccess(response, { notification })
}
