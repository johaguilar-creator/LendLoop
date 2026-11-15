import { Router } from 'express'
import {
  archiveItem,
  createItem,
  getItem,
  listItems,
  listMyItems,
  updateItem,
} from '../controllers/item.controller.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  createItemSchema,
  itemIdSchema,
  itemSearchSchema,
  updateItemSchema,
} from '../validation/item.validation.js'

const router = Router()

router.get('/', validate(itemSearchSchema), asyncHandler(listItems))
router.get('/mine', authenticate, asyncHandler(listMyItems))
router.post('/', authenticate, validate(createItemSchema), asyncHandler(createItem))
router.get('/:itemId', validate(itemIdSchema), asyncHandler(getItem))
router.patch(
  '/:itemId',
  authenticate,
  validate(updateItemSchema),
  asyncHandler(updateItem),
)
router.delete(
  '/:itemId',
  authenticate,
  validate(itemIdSchema),
  asyncHandler(archiveItem),
)

export default router
