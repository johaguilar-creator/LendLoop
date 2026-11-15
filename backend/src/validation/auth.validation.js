import { z } from 'zod'

const adnuEmail = z
  .string()
  .trim()
  .email()
  .transform((email) => email.toLowerCase())
  .refine((email) => email.endsWith('@adnu.edu.ph'), {
    message: 'Use your @adnu.edu.ph email address.',
  })

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      email: adnuEmail,
      password: z.string().min(10).max(128),
      studentId: z.string().trim().max(40).optional(),
    })
    .strict(),
  params: z.object({}),
  query: z.object({}),
})

export const loginSchema = z.object({
  body: z
    .object({
      email: adnuEmail,
      password: z.string().min(1).max(128),
    })
    .strict(),
  params: z.object({}),
  query: z.object({}),
})
