import { z } from 'zod'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'ID is invalid.')

export const conversationIdSchema = z.object({
  body: z.object({}),
  params: z.object({ conversationId: objectId }),
  query: z.object({}),
})

export const messageListSchema = z.object({
  body: z.object({}),
  params: z.object({ conversationId: objectId }),
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    })
    .strict(),
})

export const sendMessageSchema = z.object({
  body: z.object({ body: z.string().trim().min(1).max(2000) }).strict(),
  params: z.object({ conversationId: objectId }),
  query: z.object({}),
})
