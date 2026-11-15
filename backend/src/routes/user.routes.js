import { Router } from 'express'
import { getMyProfile, updateMyProfile } from '../controllers/user.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { profileUpdateSchema } from '../validation/user.validation.js'

const router = Router()

router.use(authenticate)
router.get('/me', asyncHandler(getMyProfile))
router.patch('/me', validate(profileUpdateSchema), asyncHandler(updateMyProfile))

export default router
