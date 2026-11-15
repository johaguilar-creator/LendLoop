import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/app.js'
import { itemSearchSchema } from '../src/validation/item.validation.js'

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

test('item search rejects invalid filters and bounds pagination', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/items?category=unlisted&page=0&limit=1000`,
    )
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.error.code, 'VALIDATION_ERROR')
  })

  test('item search accepts availability filters and defaults to available listings', () => {
    const parse = (query) => itemSearchSchema.safeParse({ body: {}, params: {}, query })
    assert.equal(parse({ availability: 'unavailable' }).success, true)
    assert.equal(parse({ availability: 'all' }).success, true)
    assert.equal(parse({ availability: 'pending' }).success, false)
    assert.equal(parse({}).data.query.availability, 'available')
  })
})

test('item details reject malformed identifiers before querying MongoDB', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/items/not-an-object-id`)
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.error.code, 'VALIDATION_ERROR')
  })
})

test('item creation requires an authenticated user', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Graphing calculator',
        description: 'A working calculator available for campus pickup.',
        category: 'school_supplies',
        condition: 'good',
      }),
    })
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})
