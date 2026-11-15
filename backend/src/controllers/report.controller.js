import { Item, Loan, Report, User } from '../models/index.js'
import { ApiError } from '../middleware/ApiError.js'
import { sendSuccess } from '../utils/response.js'

const targets = { item: Item, user: User, loan: Loan }

export async function createReport(request, response) {
  const { targetType, targetId, category, description } = request.validated.body
  const target = await targets[targetType].findById(targetId).select('_id owner borrower')
  if (!target) throw new ApiError(404, 'REPORT_TARGET_NOT_FOUND', 'Report subject not found.')
  if (targetType === 'user' && target.id === request.user.id) {
    throw new ApiError(400, 'CANNOT_REPORT_SELF', 'You cannot report your own account.')
  }

  const report = await Report.create({
    reporter: request.user.id,
    targetType,
    targetId,
    category,
    description,
  })
  return sendSuccess(
    response,
    {
      report: {
        id: report.id,
        category: report.category,
        status: report.status,
        createdAt: report.createdAt,
      },
    },
    201,
  )
}

export async function listReports(request, response) {
  const { status, page, limit } = request.validated.query
  const filter = status ? { status } : {}
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .select('+internalNotes')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reporter', 'name email')
      .populate('reviewedBy', 'name email'),
    Report.countDocuments(filter),
  ])
  return sendSuccess(response, {
    reports,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function updateReport(request, response) {
  const { reportId } = request.validated.params
  const { status, internalNotes } = request.validated.body
  const changes = {
    status,
    reviewedBy: request.user.id,
    reviewedAt: new Date(),
  }
  if (internalNotes !== undefined) changes.internalNotes = internalNotes
  const report = await Report.findByIdAndUpdate(
    reportId,
    { $set: changes },
    { new: true, runValidators: true },
  ).select('+internalNotes')
  if (!report) throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found.')
  return sendSuccess(response, { report })
}
