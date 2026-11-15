import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, api, type LendingItem, type ReportTarget } from '../lib/api'

type ItemDetailsPageProps = {
  itemId: string
  userId: string
  activeBorrowingCount: number
  onBack: () => void
  onViewLoans: () => void
  onReportTarget: (target: ReportTarget) => void
}

function localDate(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ItemDetailsPage({
  itemId,
  userId,
  activeBorrowingCount,
  onBack,
  onViewLoans,
  onReportTarget,
}: ItemDetailsPageProps) {
  const [item, setItem] = useState<LendingItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [returnDate, setReturnDate] = useState(() => localDate(3))
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [requestSent, setRequestSent] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void api
      .get<{ item: LendingItem }>(`/items/${itemId}`)
      .then((result) => {
        if (active) setItem(result.item)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Unable to load this item. Check your connection and try again.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [itemId, retry])

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setRequestError('')
    const proposedReturnDate = new Date(`${returnDate}T17:00:00`)

    if (Number.isNaN(proposedReturnDate.getTime()) || proposedReturnDate.getTime() <= Date.now()) {
      setRequestError('Choose a return date in the future.')
      setSubmitting(false)
      return
    }

    try {
      await api.post('/borrow-requests', {
        itemId,
        proposedReturnDate: proposedReturnDate.toISOString(),
        message: message.trim(),
      })
      setRequestSent(true)
    } catch (requestError) {
      setRequestError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to send your request. Check your connection and try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="content detail-page">
      <button className="back" onClick={onBack}>← Back to discover</button>
      {loading && <div className="items-state" role="status">Loading item details…</div>}
      {!loading && error && (
        <div className="items-state items-error" role="alert">
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => setRetry((value) => value + 1)}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && item && (
        <div className="detail-grid">
          {item.imageUrl ? (
            <img className="detail-image" src={item.imageUrl} alt={item.title} />
          ) : (
            <div className="detail-image detail-image-placeholder" aria-hidden="true">
              No photo provided
            </div>
          )}
          <div className="detail-info">
            <div className="availability inline"><i />{item.available ? 'Available now' : 'Currently unavailable'}</div>
            <div className="eyebrow">{item.category.replace(/_/g, ' ')} · {item.condition.replace(/_/g, ' ')}</div>
            <h1>{item.title}</h1>
            <p className="description">{item.description}</p>
            <div className="lender">
              {item.owner.avatarUrl ? (
                <img className="avatar" src={item.owner.avatarUrl} alt="" />
              ) : (
                <div className="avatar" aria-hidden="true">
                  {item.owner.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                </div>
              )}
              <div>
                <small>SHARED BY</small>
                <strong>{item.owner.name}</strong>
                <p>LoopScore {item.owner.creditScore}</p>
              </div>
            </div>
            {item.owner._id === userId ? (
              <div className="request-box"><p className="empty-note">You own this listing.</p></div>
            ) : activeBorrowingCount >= 5 ? (
              <div className="request-box"><p className="form-error">You have reached the limit of five active loans. Return an item before requesting another.</p></div>
            ) : requestSent ? (
              <div className="request-box">
                <p className="form-success" role="status">Your request was sent to {item.owner.name}.</p>
                <button className="btn-primary full request-followup" onClick={onViewLoans}>View my loans</button>
              </div>
            ) : (
              <form className="request-box borrow-request-form" onSubmit={submitRequest}>
                <label htmlFor="proposed-return-date">Proposed return date</label>
                <input
                  id="proposed-return-date"
                  min={localDate(1)}
                  onChange={(event) => setReturnDate(event.target.value)}
                  required
                  type="date"
                  value={returnDate}
                />
                <small className="field-hint">The owner can review your proposed date.</small>
                <label htmlFor="borrow-message">Message to the owner (optional)</label>
                <textarea
                  id="borrow-message"
                  maxLength={1000}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Share when you need the item or ask a question."
                  rows={3}
                  value={message}
                />
                {requestError && <div className="form-error" role="alert">{requestError}</div>}
                <button className="btn-primary full" disabled={submitting}>
                  {submitting ? 'Sending request…' : 'Request to borrow'}
                </button>
              </form>
            )}
            <div className="detail-report-actions">
              <button
                onClick={() => onReportTarget({
                  targetType: 'item',
                  targetId: item._id,
                  label: item.title,
                })}
              >
                Report listing
              </button>
              {item.owner._id !== userId && (
                <button
                  onClick={() => onReportTarget({
                    targetType: 'user',
                    targetId: item.owner._id,
                    label: item.owner.name,
                  })}
                >
                  Report owner
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
