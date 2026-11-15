import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/app.js'

async function withServer(run) {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  try {
    await run(`http://127.0.0.1:${server.address().port}`)
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
}

test('registration rejects non-ADNU email addresses before persistence', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Student Example',
        email: 'student@example.com',
        password: 'valid-password',
      }),
    })
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.error.code, 'VALIDATION_ERROR')
    assert.match(JSON.stringify(body.error.details), /adnu\.edu\.ph/)
  })
})

test('auth API allows credentialed browser requests from the frontend origin', async () => {
  await withServer(async (baseUrl) => {
    const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:8443'
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        origin: frontendOrigin,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    })

    assert.equal(response.status, 204)
    assert.equal(response.headers.get('access-control-allow-origin'), frontendOrigin)
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true')
    assert.match(response.headers.get('access-control-allow-methods') || '', /POST/)
  })
})

test('protected auth endpoints reject requests without a session cookie', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/me`)
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})

test('registration rejects unknown fields and weak passwords', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Student Example',
        email: 'student@adnu.edu.ph',
        password: 'short',
        role: 'admin',
      }),
    })
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.error.code, 'VALIDATION_ERROR')
  })
})
