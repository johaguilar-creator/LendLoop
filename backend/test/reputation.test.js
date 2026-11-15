import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/app.js'
import { calculateCreditScoreAdjustment } from '../src/services/reputation.service.js'

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

test('credit score changes follow centralized provisional rules and bounds', () => {
  assert.deepEqual(calculateCreditScoreAdjustment(70, true), {
    delta: 2,
    scoreAfter: 72,
  })
  assert.deepEqual(calculateCreditScoreAdjustment(70, false), {
    delta: -10,
    scoreAfter: 60,
  })
  assert.deepEqual(calculateCreditScoreAdjustment(100, true), {
    delta: 0,
    scoreAfter: 100,
  })
  assert.deepEqual(calculateCreditScoreAdjustment(5, false), {
    delta: -5,
    scoreAfter: 0,
  })
})

test('reputation endpoint requires an authenticated student', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reputation/me`)
    const body = await response.json()

    assert.equal(response.status, 401)
    assert.equal(body.error.code, 'UNAUTHENTICATED')
  })
})
