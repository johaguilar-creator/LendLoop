import { Router } from 'express'
import {
  listConversations,
  listMessages,
  markMessagesRead,
  sendMessage,
} from '../controllers/conversation.controller.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  conversationIdSchema,
  messageListSchema,
  sendMessageSchema,
} from '../validation/conversation.validation.js'

const router = Router()

router.use(authenticate)
router.get('/', asyncHandler(listConversations))
router.get(
  '/:conversationId/messages',
  validate(messageListSchema),
  asyncHandler(listMessages),
)
router.post(
  '/:conversationId/messages',
  validate(sendMessageSchema),
  asyncHandler(sendMessage),
)
router.patch(
  '/:conversationId/read',
  validate(conversationIdSchema),
  asyncHandler(markMessagesRead),
)

export default router
