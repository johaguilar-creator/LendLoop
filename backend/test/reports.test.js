import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/app.js'
import { requireRole } from '../src/middleware/authenticate.js'
import { createReportSchema } from '../src/validation/report.validation.js'

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

test('report validation requires a supported category and valid subject', () => {
  const result = createReportSchema.safeParse({
    body: {
      targetType: 'item',
      targetId: 'not-an-object-id',
      category: 'made_up_category',
      description: 'This is a report description.',
    },
    params: {},
    query: {},
  })
  assert.equal(result.success, false)
})

test('student roles cannot pass administrator authorization', () => {
  let actualError
  requireRole('admin')({ user: { role: 'student' } }, {}, (error) => {
    actualError = error
  })
  assert.equal(actualError.status, 403)
  assert.equal(actualError.code, 'FORBIDDEN')
})

test('report submission requires an authenticated reporter', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetType: 'item',
        targetId: '507f1f77bcf86cd799439011',
        category: 'inappropriate_listing',
        description: 'This listing includes misleading information.',
      }),
    })
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})

test('report management is protected', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/reports`)
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})
