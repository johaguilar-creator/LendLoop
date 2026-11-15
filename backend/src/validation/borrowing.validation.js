import { z } from 'zod'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'ID is invalid.')
const futureDate = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .refine((value) => value.getTime() > Date.now(), {
    message: 'Return date must be in the future.',
  })

export const createBorrowRequestSchema = z.object({
  body: z
    .object({
      itemId: objectId,
      proposedReturnDate: futureDate,
      message: z.string().trim().max(1000).optional().default(''),
    })
    .strict(),
  params: z.object({}),
  query: z.object({}),
})

export const borrowRequestListSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict(),
})

export const borrowRequestDecisionSchema = z.object({
  body: z.object({ decision: z.enum(['approve', 'reject']) }).strict(),
  params: z.object({ requestId: objectId }),
  query: z.object({}),
})

export const loanIdSchema = z.object({
  body: z.object({}),
  params: z.object({ loanId: objectId }),
  query: z.object({}),
})
