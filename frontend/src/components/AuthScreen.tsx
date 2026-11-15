import { useState, type FormEvent } from 'react'
import { ApiError, api, type Student } from '../lib/api'

type AuthScreenProps = {
  onAuthenticated: (user: Student) => void
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const normalizedEmail = email.trim().toLowerCase()

    if (!/^[^\s@]+@adnu\.edu\.ph$/.test(normalizedEmail)) {
      setError('Use your @adnu.edu.ph email address.')
      return
    }
    if (mode === 'register' && name.trim().length < 2) {
      setError('Enter your name (at least 2 characters).')
      return
    }
    if (mode === 'register' && password.length < 10) {
      setError('Your password must be at least 10 characters.')
      return
    }

    setSubmitting(true)
    try {
      const result =
        mode === 'register'
          ? await api.post<{ user: Student }>('/auth/register', {
              name: name.trim(),
              email: normalizedEmail,
              password,
            })
          : await api.post<{ user: Student }>('/auth/login', {
              email: normalizedEmail,
              password,
            })
      onAuthenticated(result.user)
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to reach LendLoop. Check your connection and try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function changeMode(nextMode: 'login' | 'register') {
    setMode(nextMode)
    setError('')
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="brand auth-brand">
          <div className="brand-mark">L</div>
          <div>
            Lend<span>Loop</span>
          </div>
        </div>
        <div>
          <div className="kicker">ATENEO DE NAGA UNIVERSITY</div>
          <h1>Good things go further when we share.</h1>
          <p>
            Borrow what you need from students you trust, and lend the things
            you do not use every day.
          </p>
        </div>
        <div className="auth-trust">
          <span className="auth-trust-icon">✓</span>
          <div>
            <strong>For the ADNU community</strong>
            <small>Sign up with your university email.</small>
          </div>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-tabs" role="tablist" aria-label="Account access">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => changeMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => changeMode('register')}
          >
            Create account
          </button>
        </div>

        <div className="auth-heading">
          <div className="kicker">WELCOME TO LENDLOOP</div>
          <h2 id="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Join the community'}
          </h2>
          <p>
            {mode === 'login'
              ? 'Sign in to continue to your student account.'
              : 'Create an account with your @adnu.edu.ph email.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit} noValidate>
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name">Full name</label>
              <input
                autoComplete="name"
                id="auth-name"
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </div>
          )}
          <div>
            <label htmlFor="auth-email">University email</label>
            <input
              autoComplete="email"
              id="auth-email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@adnu.edu.ph"
              required
              type="email"
              value={email}
            />
          </div>
          <div>
            <label htmlFor="auth-password">Password</label>
            <div className="password-field">
              <input
                autoComplete={
                  mode === 'register' ? 'new-password' : 'current-password'
                }
                id="auth-password"
                maxLength={128}
                minLength={mode === 'register' ? 10 : 1}
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {mode === 'register' && (
              <small className="field-hint">Use at least 10 characters.</small>
            )}
          </div>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button className="btn-primary auth-submit" disabled={submitting}>
            {submitting
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? 'New to LendLoop?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </section>
    </main>
  )
}
