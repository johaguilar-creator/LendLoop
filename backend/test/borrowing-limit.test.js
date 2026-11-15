import assert from 'node:assert/strict'
import test from 'node:test'
import { assertBorrowingCapacity } from '../src/utils/borrowingLimit.js'

test('borrower can request an item below the active-loan limit', () => {
  assert.doesNotThrow(() => assertBorrowingCapacity(4))
})

test('borrower at the five-loan limit receives a clear conflict', () => {
  assert.throws(
    () => assertBorrowingCapacity(5),
    (error) => {
      assert.equal(error.status, 409)
      assert.equal(error.code, 'BORROWING_LIMIT_REACHED')
      assert.equal(error.details.limit, 5)
      assert.equal(error.details.activeCount, 5)
      return true
    },
  )
})
