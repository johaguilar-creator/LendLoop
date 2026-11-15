import { Router } from 'express'
import {
  getMyReputation,
  listCreditEvents,
} from '../controllers/reputation.controller.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.use(authenticate)
router.get('/me', asyncHandler(getMyReputation))
router.get('/me/events', asyncHandler(listCreditEvents))

export default router
