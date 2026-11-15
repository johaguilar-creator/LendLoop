export const SESSION_COOKIE = 'lendloop_session'
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: SESSION_TTL_MS,
  }
}

export function clearSessionCookieOptions() {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions()
  return options
}
