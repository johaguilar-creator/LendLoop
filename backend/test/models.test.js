import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { BorrowRequest, Conversation, Item, User } from '../src/models/index.js'

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
