import { z } from 'zod'

const secureAvatarUrl = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .max(2048)
    .url()
    .refine((value) => new URL(value).protocol === 'https:', {
      message: 'Avatar URLs must use HTTPS.',
    }),
])

export const profileUpdateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      bio: z.string().trim().max(500).optional(),
      avatarUrl: secureAvatarUrl.optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Provide at least one profile field to update.',
    }),
  params: z.object({}),
  query: z.object({}),
})
