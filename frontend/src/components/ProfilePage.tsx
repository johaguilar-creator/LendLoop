import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, api, type Student } from '../lib/api'

type CreditEvent = {
  _id: string
  reason: 'on_time_return' | 'late_return'
  delta: number
  scoreAfter: number
  createdAt: string
}

type RewardEvent = {
  _id: string
  type: 'on_time_return'
  points: number
  description: string
  createdAt: string
}

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

      <ReputationHistory user={user} />
    </>
  )
}

function ReputationHistory({ user }: { user: Student }) {
  const [creditScore, setCreditScore] = useState<number | null>(null)
  const [standing, setStanding] = useState('')
  const [rulesStatus, setRulesStatus] = useState('')
  const [points, setPoints] = useState<number | null>(null)
  const [creditEvents, setCreditEvents] = useState<CreditEvent[]>([])
  const [rewardEvents, setRewardEvents] = useState<RewardEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void Promise.all([
      api.get<{ creditScore: number; standing: string; rulesStatus: string }>('/reputation/me'),
      api.get<{ events: CreditEvent[] }>('/reputation/me/events'),
      api.get<{ points: number }>('/rewards/me'),
      api.get<{ events: RewardEvent[] }>('/rewards/me/events'),
    ])
      .then(([reputation, creditHistory, rewards, rewardHistory]) => {
        if (active) {
          setCreditScore(reputation.creditScore)
          setStanding(reputation.standing)
          setRulesStatus(reputation.rulesStatus)
          setCreditEvents(creditHistory.events)
          setPoints(rewards.points)
          setRewardEvents(rewardHistory.events)
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Unable to load reputation history. Check your connection and try again.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [retry, user.creditScore, user.id, user.rewardPoints])

  return (
    <section className="reputation profile-reputation">
      <h2>Your reputation</h2>
      {loading && <div className="items-state" role="status">Loading your score and rewards…</div>}
      {!loading && error && (
        <div className="items-state items-error" role="alert">
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => setRetry((value) => value + 1)}>Try again</button>
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="score-block">
            <div className="score-ring large">{creditScore}</div>
            <div>
              <strong>{standing}</strong>
              <p>Current LoopScore from the LendLoop API.</p>
              {rulesStatus === 'provisional' && <small className="provisional-note">Scoring rules are provisional pending group approval.</small>}
            </div>
          </div>
          <div className="badge-row">
            <div>★<span>{points?.toLocaleString()}<br /><small>Loop Points</small></span></div>
            <div>↗<span>{user.activeBorrowingCount}<br /><small>Active loans</small></span></div>
            <div>✓<span>{user.role === 'admin' ? 'Administrator' : 'Student'}<br /><small>Account role</small></span></div>
          </div>
          <div className="reputation-history-grid">
            <section className="reputation-history">
              <h3>Score history</h3>
              {creditEvents.length === 0 ? (
                <p className="empty-note">Your score history will appear after a loan is returned.</p>
              ) : creditEvents.map((event) => (
                <article className="reputation-event" key={event._id}>
                  <div>
                    <strong>{event.reason === 'on_time_return' ? 'On-time return' : 'Late return'}</strong>
                    <time>{new Date(event.createdAt).toLocaleDateString()}</time>
                  </div>
                  <span className={event.delta >= 0 ? 'event-positive' : 'event-negative'}>
                    {event.delta > 0 ? '+' : ''}{event.delta} · {event.scoreAfter}
                  </span>
                </article>
              ))}
            </section>
            <section className="reputation-history">
              <h3>Reward history</h3>
              {rewardEvents.length === 0 ? (
                <p className="empty-note">Eligible reward activity will appear here.</p>
              ) : rewardEvents.map((event) => (
                <article className="reputation-event" key={event._id}>
                  <div>
                    <strong>{event.description}</strong>
                    <time>{new Date(event.createdAt).toLocaleDateString()}</time>
                  </div>
                  <span className="event-positive">+{event.points} pts</span>
                </article>
              ))}
            </section>
          </div>
        </>
      )}
    </section>
  )
}
