import { useState, type FormEvent } from 'react'
import { ApiError, api, type Student } from '../lib/api'

type ProfilePageProps = {
  user: Student
  onUserUpdated: (user: Student) => void
}

export default function ProfilePage({ user, onUserUpdated }: ProfilePageProps) {
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const result = await api.patch<{ user: Student }>('/users/me', {
        name: name.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
      })
      onUserUpdated(result.user)
      setName(result.user.name)
      setBio(result.user.bio)
      setAvatarUrl(result.user.avatarUrl)
      setSaved(true)
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to save your profile. Check your connection and try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-title">
        <div>
          <div className="kicker">LENDLOOP</div>
          <h1>Student profile</h1>
          <p>Manage your account details and how you appear to other students.</p>
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          {user.avatarUrl ? (
            <img className="big-avatar profile-avatar" src={user.avatarUrl} alt="" />
          ) : (
            <div className="big-avatar" aria-hidden="true">{initials}</div>
          )}
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="verified">✓ University account</span>
          <hr />
          <div className="profile-details">
            <div><small>STUDENT ID</small><strong>{user.studentId || 'Not provided'}</strong></div>
            <div><small>MEMBER SINCE</small><strong>{new Date(user.createdAt).toLocaleDateString()}</strong></div>
          </div>
        </section>

        <section className="profile-settings">
          <h2>Edit profile</h2>
          <p>Your university email and student ID are read-only account identifiers.</p>
          <form className="profile-form" onSubmit={saveProfile}>
            <div>
              <label htmlFor="profile-name">Full name</label>
              <input
                autoComplete="name"
                id="profile-name"
                maxLength={100}
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </div>
            <div>
              <label htmlFor="profile-bio">About you</label>
              <textarea
                id="profile-bio"
                maxLength={500}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Share a little about yourself with the community."
                rows={4}
                value={bio}
              />
              <small className="field-hint">{bio.length}/500 characters</small>
            </div>
            <div>
              <label htmlFor="profile-avatar">Profile photo URL</label>
              <input
                autoComplete="url"
                id="profile-avatar"
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://example.com/photo.jpg"
                type="url"
                value={avatarUrl}
              />
              <small className="field-hint">Use a secure HTTPS image URL.</small>
            </div>
            {error && <div className="form-error" role="alert">{error}</div>}
            {saved && <p className="form-success" role="status">Your profile has been saved.</p>}
            <button className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </section>
      </div>

      <section className="reputation profile-reputation">
        <h2>Your reputation</h2>
        <div className="score-block">
          <div className="score-ring large">{user.creditScore}</div>
          <div>
            <strong>Current LoopScore</strong>
            <p>Your score is updated from confirmed loan activity. Scoring rules are provisional.</p>
          </div>
        </div>
        <div className="badge-row">
          <div>★<span>{user.rewardPoints}<br /><small>Loop Points</small></span></div>
          <div>↗<span>{user.activeBorrowingCount}<br /><small>Active loans</small></span></div>
          <div>✓<span>{user.role === 'admin' ? 'Administrator' : 'Student'}<br /><small>Account role</small></span></div>
        </div>
      </section>
    </>
  )
}
