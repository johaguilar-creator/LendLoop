import { BorrowRequest, Item, Loan } from '../models/index.js'
import { ApiError } from '../middleware/ApiError.js'
import { sendSuccess } from '../utils/response.js'

function itemQuery(search) {
  const filter = { archivedAt: null }
  if (search.availability !== 'all') {
    filter.available = search.availability === 'available'
  }
  if (search.category) filter.category = search.category
  if (search.q) {
    const escaped = search.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ]
  }
  return filter
}

function itemSort(sort) {
  if (sort === 'oldest') return { createdAt: 1 }
  if (sort === 'title') return { title: 1 }
  return { createdAt: -1 }
}

export async function listItems(request, response) {
  const { page, limit, ...filters } = request.validated.query
  const query = itemQuery(filters)
  const [items, total] = await Promise.all([
    Item.find(query)
      .sort(itemSort(filters.sort))
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('owner', 'name avatarUrl creditScore'),
    Item.countDocuments(query),
  ])
  return sendSuccess(response, {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function listMyItems(request, response) {
  const items = await Item.find({
    owner: request.user.id,
    archivedAt: null,
  })
    .sort({ updatedAt: -1 })
    .populate('owner', 'name avatarUrl creditScore')
  return sendSuccess(response, { items })
}

export async function getItem(request, response) {
  const { itemId } = request.validated.params
  const item = await Item.findOne({
    _id: itemId,
    available: true,
    archivedAt: null,
  }).populate('owner', 'name avatarUrl creditScore')
  if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Item not found.')
  return sendSuccess(response, { item })
}

export async function createItem(request, response) {
  const item = await Item.create({
    ...request.validated.body,
    owner: request.user.id,
  })
  await item.populate('owner', 'name avatarUrl creditScore')
  return sendSuccess(response, { item }, 201)
}

export async function updateItem(request, response) {
  const { itemId } = request.validated.params
  const item = await Item.findOne({ _id: itemId, archivedAt: null })
  if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Item not found.')
  if (!item.owner.equals(request.user.id)) {
    throw new ApiError(403, 'FORBIDDEN', 'You can only edit your own listings.')
  }

  if (request.validated.body.available === true) {
    const activeLoan = await Loan.exists({ item: item.id, status: 'active' })
    if (activeLoan) {
      throw new ApiError(409, 'ITEM_ON_LOAN', 'An item on an active loan cannot be listed.')
    }
  }

  Object.assign(item, request.validated.body)
  await item.save()
  await item.populate('owner', 'name avatarUrl creditScore')
  return sendSuccess(response, { item })
}

export async function archiveItem(request, response) {
  const { itemId } = request.validated.params
  const item = await Item.findOne({ _id: itemId, archivedAt: null })
  if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Item not found.')
  if (!item.owner.equals(request.user.id)) {
    throw new ApiError(403, 'FORBIDDEN', 'You can only remove your own listings.')
  }

  const [activeLoan, pendingRequest] = await Promise.all([
    Loan.exists({ item: item.id, status: 'active' }),
    BorrowRequest.exists({ item: item.id, status: 'pending' }),
  ])
  if (activeLoan || pendingRequest) {
    throw new ApiError(
      409,
      'ITEM_HAS_OPEN_BORROWING',
      'Resolve active loans and pending requests before removing this listing.',
    )
  }

  item.available = false
  item.archivedAt = new Date()
  await item.save()
  return sendSuccess(response, { message: 'Listing removed.' })
}
