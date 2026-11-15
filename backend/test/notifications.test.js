import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/app.js'
import { notificationListSchema } from '../src/validation/notification.validation.js'

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

test('notification unread filter parses an explicit boolean', () => {
  const parsed = notificationListSchema.parse({
    body: {},
    params: {},
    query: { unreadOnly: 'true', page: '2', limit: '10' },
  })
  assert.equal(parsed.query.unreadOnly, true)
  assert.equal(parsed.query.page, 2)
  assert.equal(parsed.query.limit, 10)
})

test('notification list is protected', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`)
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})

test('notification mark-as-read is protected', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/notifications/507f1f77bcf86cd799439011/read`,
      { method: 'PATCH' },
    )
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})
