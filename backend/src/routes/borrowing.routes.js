import { Router } from 'express'
import {
  confirmLoanReturn,
  createBorrowRequest,
  decideBorrowRequest,
  listBorrowRequests,
  listLoans,
  requestLoanReturn,
} from '../controllers/borrowing.controller.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  borrowRequestDecisionSchema,
  borrowRequestListSchema,
  createBorrowRequestSchema,
  loanIdSchema,
} from '../validation/borrowing.validation.js'

const borrowRequests = Router()
borrowRequests.use(authenticate)
borrowRequests.get('/', validate(borrowRequestListSchema), asyncHandler(listBorrowRequests))
borrowRequests.post('/', validate(createBorrowRequestSchema), asyncHandler(createBorrowRequest))
borrowRequests.patch(
  '/:requestId/decision',
  validate(borrowRequestDecisionSchema),
  asyncHandler(decideBorrowRequest),
)

const loans = Router()
loans.use(authenticate)
loans.get('/', asyncHandler(listLoans))
loans.post('/:loanId/return', validate(loanIdSchema), asyncHandler(requestLoanReturn))
loans.patch('/:loanId/return', validate(loanIdSchema), asyncHandler(confirmLoanReturn))

export { borrowRequests, loans }
