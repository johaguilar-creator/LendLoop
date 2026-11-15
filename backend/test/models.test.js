import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { BorrowRequest, Conversation, Item, User } from '../src/models/index.js'
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

test('user schema requires a name and ADNU email', async () => {
  const missingName = new User({
    email: 'student@adnu.edu.ph',
    passwordHash: 'hash',
  })
  await assert.rejects(missingName.validate(), /name/)

  const invalidDomain = new User({
    name: 'Student Example',
    email: 'student@example.com',
    passwordHash: 'hash',
  })
  await assert.rejects(invalidDomain.validate(), /@adnu\.edu\.ph/)
})

test('item schema rejects unsupported categories and short descriptions', async () => {
  const item = new Item({
    owner: new mongoose.Types.ObjectId(),
    title: 'Calculator',
    description: 'Short',
    category: 'furniture',
    condition: 'good',
  })
  await assert.rejects(item.validate(), (error) => {
    assert.ok(error.errors.category)
    assert.ok(error.errors.description)
    return true
  })
})

test('borrow request status is constrained to the documented workflow', async () => {
  const request = new BorrowRequest({
    item: new mongoose.Types.ObjectId(),
    borrower: new mongoose.Types.ObjectId(),
    owner: new mongoose.Types.ObjectId(),
    proposedReturnDate: new Date(Date.now() + 86_400_000),
    status: 'completed',
  })
  await assert.rejects(request.validate(), /`completed` is not a valid enum value/)
})

test('conversation requires two distinct participants', async () => {
  const participant = new mongoose.Types.ObjectId()
  const conversation = new Conversation({
    participants: [participant, participant],
  })
  await assert.rejects(conversation.validate(), /two distinct participants/)
})

test('health endpoint uses the standard success envelope', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      success: true,
      data: { status: 'ok' },
    })
  })
})

test('unknown routes use the standard error envelope', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/not-a-route`)
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found.' },
    })
  })
})
