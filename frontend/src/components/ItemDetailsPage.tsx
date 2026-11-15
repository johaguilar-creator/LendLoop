import { useEffect, useState } from 'react'
import { ApiError, api, type LendingItem } from '../lib/api'

type ItemDetailsPageProps = {
  itemId: string
  onBack: () => void
}

export default function ItemDetailsPage({ itemId, onBack }: ItemDetailsPageProps) {
  const [item, setItem] = useState<LendingItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

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
            <div className="request-box">
              <div className="limit-note">
                <span>Borrowing requests will be available when the loan workflow is connected.</span>
              </div>
              <button className="btn-primary full" disabled>Request to borrow</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
