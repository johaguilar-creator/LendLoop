import { z } from 'zod'
import { REPORT_CATEGORIES } from '../models/constants.js'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'ID is invalid.')

export const createReportSchema = z.object({
  body: z
    .object({
      targetType: z.enum(['item', 'user', 'loan']),
      targetId: objectId,
      category: z.enum(REPORT_CATEGORIES),
      description: z.string().trim().min(10).max(3000),
    })
    .strict(),
  params: z.object({}),
  query: z.object({}),
})

export const reportListSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z
    .object({
      status: z
        .enum([
          'submitted',
          'under_review',
          'resolved',
          'dismissed',
          'referred_to_osa',
        ])
        .optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict(),
})

export const updateReportSchema = z.object({
  body: z
    .object({
      status: z.enum([
        'under_review',
        'resolved',
        'dismissed',
        'referred_to_osa',
      ]),
      internalNotes: z.string().trim().max(2000).optional(),
    })
    .strict(),
  params: z.object({
    reportId: objectId,
  }),
  query: z.object({}),
})
