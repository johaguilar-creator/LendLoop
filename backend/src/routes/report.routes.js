import { Router } from 'express'
import {
  createReport,
  listReports,
  updateReport,
} from '../controllers/report.controller.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authenticate, requireRole } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  createReportSchema,
  reportListSchema,
  updateReportSchema,
} from '../validation/report.validation.js'

const reports = Router()
reports.post(
  '/',
  authenticate,
  validate(createReportSchema),
  asyncHandler(createReport),
)

const adminReports = Router()
adminReports.use(authenticate, requireRole('admin'))
adminReports.get('/', validate(reportListSchema), asyncHandler(listReports))
adminReports.patch(
  '/:reportId',
  validate(updateReportSchema),
  asyncHandler(updateReport),
)

export { adminReports, reports }
