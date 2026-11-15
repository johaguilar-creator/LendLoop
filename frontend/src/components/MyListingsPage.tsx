import { useEffect, useState } from 'react'
import ListingForm from './ListingForm'
import { ApiError, api, type LendingItem } from '../lib/api'

type MyListingsPageProps = {
  refreshToken: number
  onCreate: () => void
}

export default function MyListingsPage({ refreshToken, onCreate }: MyListingsPageProps) {
  const [items, setItems] = useState<LendingItem[]>([])
  const [editing, setEditing] = useState<LendingItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void api
      .get<{ items: LendingItem[] }>('/items/mine')
      .then((result) => {
        if (active) setItems(result.items)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Unable to load your listings. Check your connection and try again.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [refreshToken, retry])

  async function updateAvailability(item: LendingItem) {
    setActionError('')
    try {
      await api.patch(`/items/${item._id}`, { available: !item.available })
      setRetry((value) => value + 1)
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to update listing availability.',
      )
    }
  }

  async function archiveItem(item: LendingItem) {
    if (!window.confirm(`Archive "${item.title}"? It will be removed from public listings.`)) return
    setActionError('')
    try {
      await api.delete(`/items/${item._id}`)
      setRetry((value) => value + 1)
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to archive this listing.',
      )
    }
  }

  if (editing) {
    return (
      <ListingForm
        item={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          setRetry((value) => value + 1)
        }}
      />
    )
  }

  return (
    <div className="content">
      <div className="page-title listing-page-title">
        <div>
          <div className="kicker">LENDLOOP</div>
          <h1>My listings</h1>
          <p>Manage items you have shared with the ADNU community.</p>
        </div>
        <button className="btn-primary" onClick={onCreate}>List an item</button>
      </div>
      {actionError && <div className="form-error listing-action-error" role="alert">{actionError}</div>}
      {loading && <div className="items-state" role="status">Loading your listings…</div>}
      {!loading && error && (
        <div className="items-state items-error" role="alert">
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => setRetry((value) => value + 1)}>Try again</button>
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="items-state">
          <strong>You have not listed any items yet.</strong>
          <p>Share an item with other students to get started.</p>
          <button className="btn-primary" onClick={onCreate}>Create a listing</button>
        </div>
      )}
      {!loading && !error && items.length > 0 && (
        <div className="my-listings">
          {items.map((item) => (
            <article className="my-listing" key={item._id}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" />
              ) : (
                <div className="my-listing-placeholder">No photo</div>
              )}
              <div className="my-listing-info">
                <span className={`pill ${item.available ? 'active-pill' : 'pending'}`}>
                  {item.available ? 'AVAILABLE' : 'UNAVAILABLE'}
                </span>
                <h2>{item.title}</h2>
                <p>{item.category.replace(/_/g, ' ')} · {item.condition.replace(/_/g, ' ')}</p>
              </div>
              <div className="my-listing-actions">
                <button
                  aria-label={`Edit ${item.title}`}
                  className="btn-secondary"
                  onClick={() => setEditing(item)}
                >
                  Edit
                </button>
                <button
                  aria-label={`Mark ${item.title} ${item.available ? 'unavailable' : 'available'}`}
                  className="btn-secondary"
                  onClick={() => void updateAvailability(item)}
                >
                  Mark {item.available ? 'unavailable' : 'available'}
                </button>
                <button
                  aria-label={`Archive ${item.title}`}
                  className="archive-listing"
                  onClick={() => void archiveItem(item)}
                >
                  Archive
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
