import { z } from 'zod'

export const notificationListSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      unreadOnly: z
        .enum(['true', 'false'])
        .optional()
        .transform((value) => value === 'true'),
    })
    .strict(),
})

export const notificationIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    notificationId: z
      .string()
      .regex(/^[a-f\d]{24}$/i, 'Notification ID is invalid.'),
  }),
  query: z.object({}),
})
