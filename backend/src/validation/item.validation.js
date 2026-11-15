import { z } from 'zod'
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from '../models/constants.js'

const itemId = z.string().regex(/^[a-f\d]{24}$/i, 'Item ID is invalid.')
const imageUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => new URL(value).protocol === 'https:', {
    message: 'Image URLs must use HTTPS.',
  })

const createItemBody = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(10).max(3000),
    category: z.enum(ITEM_CATEGORIES),
    condition: z.enum(ITEM_CONDITIONS),
    imageUrl: imageUrl.optional().or(z.literal('')),
  })
  .strict()

export const itemSearchSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    q: z.string().trim().max(100).optional(),
    category: z.enum(ITEM_CATEGORIES).optional(),
    sort: z.enum(['newest', 'oldest', 'title']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
  }).strict(),
})

export const itemIdSchema = z.object({
  body: z.object({}),
  params: z.object({ itemId }),
  query: z.object({}),
})
export const createItemSchema = z.object({
  body: createItemBody,
  params: z.object({}),
  query: z.object({}),
})

export const updateItemSchema = z.object({
  body: createItemBody.partial().extend({ available: z.boolean().optional() })
    .strict()
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Provide at least one field to update.',
    }),
  params: z.object({ itemId }),
  query: z.object({}),
})
