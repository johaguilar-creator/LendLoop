import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/app.js'
import { pointsForReturn } from '../src/services/reward.service.js'

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

test('only an on-time return awards the provisional reward points', () => {
  assert.equal(pointsForReturn(true), 50)
  assert.equal(pointsForReturn(false), 0)
})

test('reward balance is protected and cannot be written by a student', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/rewards/me`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ points: 100000 }),
    })
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})

test('reward history requires an authenticated student', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/rewards/me/events`)
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})
