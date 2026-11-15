import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/app.js'
import { sendMessageSchema } from '../src/validation/conversation.validation.js'

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

test('message validation trims text and rejects empty messages', () => {
  const valid = sendMessageSchema.parse({
    body: { body: '  Hello  ' },
    params: { conversationId: '507f1f77bcf86cd799439011' },
    query: {},
  })
  assert.equal(valid.body.body, 'Hello')

  const invalid = sendMessageSchema.safeParse({
    body: { body: '   ' },
    params: { conversationId: '507f1f77bcf86cd799439011' },
    query: {},
  })
  assert.equal(invalid.success, false)
})

test('conversation list requires authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/conversations`)
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})

test('conversation reads require authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/conversations/507f1f77bcf86cd799439011/messages`,
    )
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})

test('message sending and read-state updates require authentication', async () => {
  await withServer(async (baseUrl) => {
    const conversationId = '507f1f77bcf86cd799439011'
    const endpoints = [
      [`/api/conversations/${conversationId}/messages`, 'POST', { body: 'Hello' }],
      [`/api/conversations/${conversationId}/read`, 'PATCH'],
    ]

    for (const [path, method, body] of endpoints) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        ...(body
          ? {
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(body),
            }
          : {}),
      })
      const responseBody = await response.json()

      assert.equal(response.status, 401)
      assert.equal(responseBody.error.code, 'UNAUTHENTICATED')
    }
  })
})
