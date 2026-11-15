import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/app.js'
import {
  borrowRequestDecisionSchema,
  createBorrowRequestSchema,
} from '../src/validation/borrowing.validation.js'

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

test('borrow request validation requires a future return date and item ID', () => {
  const result = createBorrowRequestSchema.safeParse({
    body: {
      itemId: 'not-an-object-id',
      proposedReturnDate: '2000-01-01T12:00:00.000Z',
    },
    params: {},
    query: {},
  })
  assert.equal(result.success, false)
})

test('request decisions accept only approve or reject', () => {
  const result = borrowRequestDecisionSchema.safeParse({
    body: { decision: 'cancel' },
    params: { requestId: '507f1f77bcf86cd799439011' },
    query: {},
  })
  assert.equal(result.success, false)
})

test('borrowing request access requires authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/borrow-requests`)
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})

test('loan history is scoped to an authenticated student', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/loans`)
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})

test('borrow request decisions and return actions require authentication', async () => {
  await withServer(async (baseUrl) => {
    const requestId = '507f1f77bcf86cd799439011'
    const endpoints = [
      [`/api/borrow-requests/${requestId}/decision`, 'PATCH', { decision: 'approve' }],
      [`/api/loans/${requestId}/return`, 'POST'],
      [`/api/loans/${requestId}/return`, 'PATCH'],
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
