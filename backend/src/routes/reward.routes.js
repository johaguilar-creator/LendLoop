import { Router } from 'express'
import {
  getMyRewards,
  listRewardEvents,
} from '../controllers/reward.controller.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.use(authenticate)
router.get('/me', asyncHandler(getMyRewards))
router.get('/me/events', asyncHandler(listRewardEvents))

export default router
