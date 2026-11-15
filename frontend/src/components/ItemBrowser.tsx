import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, api, type LendingItem } from '../lib/api'

const categories = [
  ['electronics', 'Electronics'],
  ['books', 'Books'],
  ['school_supplies', 'School supplies'],
  ['photography', 'Photography'],
  ['clothing', 'Clothing'],
  ['sports', 'Sports'],
  ['other', 'Other'],
] as const

const conditionLabels: Record<string, string> = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good condition',
  fair: 'Fair condition',
}

type ItemBrowserProps = {
  compact?: boolean
  initialQuery?: string
  onOpen: (item: LendingItem) => void
}

export default function ItemBrowser({
  compact = false,
  initialQuery = '',
  onOpen,
}: ItemBrowserProps) {
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery.trim())
  const [category, setCategory] = useState('')
  const [availability, setAvailability] = useState('available')
  const [sort, setSort] = useState('newest')
  const [items, setItems] = useState<LendingItem[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    const params = new URLSearchParams({
      availability: compact ? 'available' : availability,
      sort,
      page: String(page),
      limit: compact ? '3' : '12',
    })
    if (query) params.set('q', query)
    if (category && !compact) params.set('category', category)

    if (page === 1) {
      setLoading(true)
      setLoadingMore(false)
    }
    else setLoadingMore(true)
    setError('')
    void api
      .get<{ items: LendingItem[]; pagination: { pages: number } }>(
        `/items?${params.toString()}`,
      )
      .then((result) => {
        if (active) {
          setItems((current) => page === 1 ? result.items : [...current, ...result.items])
          setPages(result.pagination.pages)
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Unable to load items. Check your connection and try again.',
          )
        }
      })
      .finally(() => {
        if (active) {
          if (page === 1) setLoading(false)
          else setLoadingMore(false)
        }
      })

    return () => {
      active = false
    }
  }, [availability, category, compact, page, query, retry, sort])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setQuery(searchInput.trim())
  }

  return (
    <>
      {!compact && (
        <>
          <form className="search-box item-search" onSubmit={submitSearch}>
            <svg className="search-symbol" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              aria-label="Search items"
              maxLength={100}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search cameras, calculators, books, and more..."
              value={searchInput}
            />
            <button className="btn-primary">Search</button>
          </form>

          <div className="item-filters">
            <label>
              <span>Category</span>
              <select onChange={(event) => {setCategory(event.target.value);setPage(1)}} value={category}>
                <option value="">All categories</option>
                {categories.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Availability</span>
              <select
                onChange={(event) => {setAvailability(event.target.value);setPage(1)}}
                value={availability}
              >
                <option value="available">Available to borrow</option>
                <option value="unavailable">Currently unavailable</option>
                <option value="all">All listings</option>
              </select>
            </label>
            <label>
              <span>Sort by</span>
              <select onChange={(event) => {setSort(event.target.value);setPage(1)}} value={sort}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title</option>
              </select>
            </label>
          </div>
        </>
      )}

      <div className="results-line" aria-live="polite">
        <strong>{loading ? 'Loading items…' : `${items.length} items shown`}</strong>
        {!compact && <span>Items shared by the ADNU community</span>}
      </div>

      {loading && <div className="items-state" role="status">Loading available items…</div>}
      {!loading && error && (
        <div className="items-state items-error" role="alert">
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => setRetry((value) => value + 1)}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="items-state">
          <strong>No items match those filters.</strong>
          <p>Try a different search or category.</p>
        </div>
      )}
      {!loading && !error && items.length > 0 && (
        <>
          <div className="items-grid">
            {items.map((item) => (
            <article className="item-card" key={item._id}>
              <div className="image-wrap">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} />
                ) : (
                  <div className="item-image-placeholder" aria-hidden="true">LendLoop</div>
                )}
                <span className={`availability ${item.available ? '' : 'not-available'}`}>
                  <i />{item.available ? 'Available now' : 'Currently unavailable'}
                </span>
              </div>
              <div className="item-body">
                <div className="eyebrow">
                  {item.category.replace(/_/g, ' ')} · {conditionLabels[item.condition] ?? item.condition}
                </div>
                <div className="item-title">{item.title}</div>
                <div className="owner">
                  {item.owner.avatarUrl ? (
                    <img src={item.owner.avatarUrl} alt="" />
                  ) : (
                    <span>{item.owner.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
                  )}
                  <div><strong>{item.owner.name}</strong><small>ADNU student</small></div>
                </div>
                <button
                  className="view-link"
                  disabled={!item.available}
                  onClick={() => onOpen(item)}
                >
                  {item.available ? 'View item' : 'Not available'}
                  {item.available && <span aria-hidden="true"> →</span>}
                </button>
              </div>
            </article>
            ))}
          </div>
          {!compact && page < pages && (
            <button
              className="btn-secondary load-more"
              disabled={loadingMore}
              onClick={() => setPage((current) => current + 1)}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </>
  )
}
