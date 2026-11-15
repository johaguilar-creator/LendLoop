export type ApiErrorBody = {
  code: string
  message: string
  details?: unknown
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export type Student = {
  id: string
  name: string
  email: string
  studentId: string | null
  bio: string
  avatarUrl: string
  role: 'student' | 'admin'
  creditScore: number
  rewardPoints: number
  activeBorrowingCount: number
  createdAt: string
}

export type LendingItem = {
  _id: string
  title: string
  description: string
  category: string
  condition: string
  imageUrl: string
  available: boolean
  owner: {
    _id: string
    name: string
    avatarUrl: string
    creditScore: number
  }
  createdAt: string
}

type SuccessEnvelope<T> = { success: true; data: T }
type ErrorEnvelope = { success: false; error: ApiErrorBody }

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  .replace(/\/+$/, '')

async function request<T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const headers = new Headers()
  if (body !== undefined) headers.set('content-type', 'application/json')

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    credentials: 'include',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

  let envelope: SuccessEnvelope<T> | ErrorEnvelope
  try {
    envelope = (await response.json()) as SuccessEnvelope<T> | ErrorEnvelope
  } catch {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'The server returned an invalid response.',
    )
  }

  if (!response.ok || !envelope.success) {
    const error = 'error' in envelope ? envelope.error : undefined
    throw new ApiError(
      response.status,
      error?.code || 'REQUEST_FAILED',
      error?.message || 'The request could not be completed.',
      error?.details,
    )
  }

  return envelope.data
}

export const api = {
  get: <T>(path: string) => request<T>(path, 'GET'),
  post: <T>(path: string, body?: unknown) => request<T>(path, 'POST', body),
  patch: <T>(path: string, body?: unknown) => request<T>(path, 'PATCH', body),
  delete: <T>(path: string) => request<T>(path, 'DELETE'),
}
