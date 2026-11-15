import mongoose from 'mongoose'
import {
  BorrowRequest,
  Conversation,
  Item,
  Loan,
  MAX_ACTIVE_BORROWINGS,
  Notification,
  User,
} from '../models/index.js'
import { ApiError } from '../middleware/ApiError.js'
import { sendSuccess } from '../utils/response.js'
import { assertBorrowingCapacity } from '../utils/borrowingLimit.js'
import { recordReturnCreditEvent } from '../services/reputation.service.js'

const requestPopulation = [
  { path: 'item', select: 'title category condition imageUrl available' },
  { path: 'borrower', select: 'name avatarUrl' },
  { path: 'owner', select: 'name avatarUrl' },
  { path: 'loan' },
]

export async function listBorrowRequests(request, response) {
  const { page, limit } = request.validated.query
  const filter = {
    $or: [{ borrower: request.user.id }, { owner: request.user.id }],
  }
  const [requests, total] = await Promise.all([
    BorrowRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(requestPopulation),
    BorrowRequest.countDocuments(filter),
  ])
  return sendSuccess(response, {
    requests,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function createBorrowRequest(request, response) {
  const { itemId, proposedReturnDate, message } = request.validated.body
  const item = await Item.findOne({
    _id: itemId,
    available: true,
    archivedAt: null,
  })
  if (!item) throw new ApiError(404, 'ITEM_NOT_AVAILABLE', 'This item is not available.')
  if (item.owner.equals(request.user.id)) {
    throw new ApiError(400, 'CANNOT_BORROW_OWN_ITEM', 'You cannot request your own item.')
  }
  assertBorrowingCapacity(request.user.activeBorrowingCount)

  const existingRequest = await BorrowRequest.exists({
    item: item.id,
    borrower: request.user.id,
    status: 'pending',
  })
  if (existingRequest) {
    throw new ApiError(409, 'REQUEST_ALREADY_PENDING', 'You already have a pending request for this item.')
  }

  const borrowRequest = await BorrowRequest.create({
    item: item.id,
    borrower: request.user.id,
    owner: item.owner,
    proposedReturnDate,
    message,
  })
  await Notification.create({
    recipient: item.owner,
    type: 'borrow_request',
    title: 'New borrowing request',
    message: `${request.user.name} requested to borrow ${item.title}.`,
    resourceType: 'borrow_request',
    resourceId: borrowRequest.id,
  })
  await borrowRequest.populate(requestPopulation)
  return sendSuccess(response, { request: borrowRequest }, 201)
}

export async function decideBorrowRequest(request, response) {
  const { requestId } = request.validated.params
  const { decision } = request.validated.body
  const session = await mongoose.startSession()
  let decidedRequest

  try {
    await session.withTransaction(async () => {
      decidedRequest = await BorrowRequest.findById(requestId).session(session)
      if (!decidedRequest) {
        throw new ApiError(404, 'REQUEST_NOT_FOUND', 'Borrowing request not found.')
      }
      if (!decidedRequest.owner.equals(request.user.id)) {
        throw new ApiError(403, 'FORBIDDEN', 'Only the item owner can decide this request.')
      }
      if (decidedRequest.status !== 'pending') {
        throw new ApiError(409, 'REQUEST_ALREADY_DECIDED', 'This request is no longer pending.')
      }

      const item = await Item.findOne({
        _id: decidedRequest.item,
        owner: request.user.id,
        archivedAt: null,
      }).session(session)
      if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'The item is no longer available.')

      decidedRequest.decisionAt = new Date()
      if (decision === 'reject') {
        decidedRequest.status = 'rejected'
        await decidedRequest.save({ session })
        await Notification.create(
          [
            {
              recipient: decidedRequest.borrower,
              type: 'request_rejected',
              title: 'Borrowing request declined',
              message: `Your request for ${item.title} was declined.`,
              resourceType: 'borrow_request',
              resourceId: decidedRequest.id,
            },
          ],
          { session },
        )
        return
      }

      const borrower = await User.findOneAndUpdate(
        {
          _id: decidedRequest.borrower,
          activeBorrowingCount: { $lt: MAX_ACTIVE_BORROWINGS },
        },
        { $inc: { activeBorrowingCount: 1 } },
        { new: true, session },
      )
      if (!borrower) {
        const existingBorrower = await User.findById(decidedRequest.borrower)
          .session(session)
          .select('activeBorrowingCount')
        if (!existingBorrower) {
          throw new ApiError(404, 'BORROWER_NOT_FOUND', 'Borrower account not found.')
        }
        assertBorrowingCapacity(existingBorrower.activeBorrowingCount)
        throw new ApiError(409, 'BORROWING_LIMIT_REACHED', 'Borrowing limit was reached.')
      }

      const reservedItem = await Item.findOneAndUpdate(
        { _id: item.id, available: true },
        { $set: { available: false } },
        { new: true, session },
      )
      if (!reservedItem) {
        throw new ApiError(409, 'ITEM_NOT_AVAILABLE', 'This item is no longer available.')
      }

      const [loan] = await Loan.create(
        [
          {
            request: decidedRequest.id,
            item: item.id,
            borrower: decidedRequest.borrower,
            owner: decidedRequest.owner,
            startedAt: new Date(),
            dueAt: decidedRequest.proposedReturnDate,
          },
        ],
        { session },
      )
      await Conversation.create(
        [
          {
            participants: [decidedRequest.borrower, decidedRequest.owner],
            loan: loan.id,
          },
        ],
        { session },
      )
      decidedRequest.status = 'approved'
      decidedRequest.loan = loan.id
      await decidedRequest.save({ session })
      await Notification.create(
        [
          {
            recipient: decidedRequest.borrower,
            type: 'request_approved',
            title: 'Borrowing request approved',
            message: `Your request for ${item.title} was approved.`,
            resourceType: 'loan',
            resourceId: loan.id,
          },
        ],
        { session },
      )
    })
  } finally {
    await session.endSession()
  }

  await decidedRequest.populate(requestPopulation)
  return sendSuccess(response, { request: decidedRequest })
}

export async function listLoans(request, response) {
  const loans = await Loan.find({
    $or: [{ borrower: request.user.id }, { owner: request.user.id }],
  })
    .sort({ dueAt: 1, createdAt: -1 })
    .populate('item', 'title category imageUrl')
    .populate('borrower', 'name avatarUrl')
    .populate('owner', 'name avatarUrl')
  return sendSuccess(response, { loans })
}

export async function requestLoanReturn(request, response) {
  const loan = await Loan.findOneAndUpdate(
    {
      _id: request.validated.params.loanId,
      borrower: request.user.id,
      status: 'active',
    },
    { $set: { status: 'return_requested' } },
    { new: true },
  ).populate('item', 'title')
  if (!loan) {
    throw new ApiError(404, 'ACTIVE_LOAN_NOT_FOUND', 'Active loan not found.')
  }

  await Notification.create({
    recipient: loan.owner,
    type: 'loan_returned',
    title: 'Return requested',
    message: `The borrower marked ${loan.item.title} as ready to return.`,
    resourceType: 'loan',
    resourceId: loan.id,
  })
  return sendSuccess(response, { loan })
}

export async function confirmLoanReturn(request, response) {
  const session = await mongoose.startSession()
  let returnedLoan
  try {
    await session.withTransaction(async () => {
      returnedLoan = await Loan.findOneAndUpdate(
        {
          _id: request.validated.params.loanId,
          owner: request.user.id,
          status: 'return_requested',
        },
        { $set: { status: 'returned', returnedAt: new Date() } },
        { new: true, session },
      )
      if (!returnedLoan) {
        throw new ApiError(404, 'RETURN_REQUEST_NOT_FOUND', 'Return request not found.')
      }

      const item = await Item.findById(returnedLoan.item).session(session)
      if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Loan item not found.')
      item.available = !item.archivedAt
      await item.save({ session })
      await recordReturnCreditEvent(returnedLoan, session)
      await BorrowRequest.updateOne(
        { loan: returnedLoan.id, status: 'approved' },
        { $set: { status: 'returned' } },
        { session },
      )
      const borrower = await User.findOneAndUpdate(
        {
          _id: returnedLoan.borrower,
          activeBorrowingCount: { $gt: 0 },
        },
        { $inc: { activeBorrowingCount: -1 } },
        { new: true, session },
      )
      if (!borrower) {
        throw new ApiError(
          500,
          'BORROWING_COUNT_INCONSISTENT',
          'Borrowing count is inconsistent; the return was not finalized.',
        )
      }
      await Notification.create(
        [
          {
            recipient: returnedLoan.borrower,
            type: 'loan_returned',
            title: 'Loan return confirmed',
            message: `The owner confirmed the return of ${item.title}.`,
            resourceType: 'loan',
            resourceId: returnedLoan.id,
          },
        ],
        { session },
      )
    })
  } finally {
    await session.endSession()
  }

  return sendSuccess(response, { loan: returnedLoan })
}
