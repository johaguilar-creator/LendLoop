import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/app.js'
import { profileUpdateSchema } from '../src/validation/user.validation.js'

function validateProfile(body) {
  return profileUpdateSchema.safeParse({ body, params: {}, query: {} })
}

test('profile updates accept editable fields and reject account-role fields', () => {
  assert.equal(
    validateProfile({
      name: 'Student Example',
      bio: 'Engineering student',
      avatarUrl: 'https://example.com/avatar.png',
    }).success,
    true,
  )
  assert.equal(validateProfile({ email: 'other@adnu.edu.ph' }).success, false)
  assert.equal(validateProfile({ role: 'admin' }).success, false)
  assert.equal(validateProfile({}).success, false)
})

test('profile update validates field limits and requires HTTPS avatar URLs', () => {
  assert.equal(validateProfile({ name: 'A' }).success, false)
  assert.equal(validateProfile({ bio: 'x'.repeat(501) }).success, false)
  assert.equal(validateProfile({ avatarUrl: 'http://example.com/avatar.png' }).success, false)
  assert.equal(validateProfile({ avatarUrl: '' }).success, true)
})

test('profile endpoints require an authenticated session', async () => {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/users/me`
    for (const [url, options] of [
      [baseUrl, {}],
      [baseUrl, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      }],
    ]) {
      const response = await fetch(url, options)
      const body = await response.json()
      assert.equal(response.status, 401)
      assert.equal(body.error.code, 'UNAUTHENTICATED')
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})
