import { Router } from 'express'
import {
  listNotifications,
  markNotificationRead,
} from '../controllers/notification.controller.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  notificationIdSchema,
  notificationListSchema,
} from '../validation/notification.validation.js'

const router = Router()

router.use(authenticate)
router.get('/', validate(notificationListSchema), asyncHandler(listNotifications))
router.patch(
  '/:notificationId/read',
  validate(notificationIdSchema),
  asyncHandler(markNotificationRead),
)

export default router
