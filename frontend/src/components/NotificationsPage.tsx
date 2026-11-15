import { useEffect, useState } from 'react'
import { ApiError, api } from '../lib/api'

type Notification = {
  _id: string
  type: string
  title: string
  message: string
  resourceType: string | null
  resourceId: string | null
  readAt: string | null
  createdAt: string
}

type NotificationsPageProps = {
  onUnreadCount: (count: number) => void
}

function formatNotificationDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function notificationLabel(type: string) {
  const labels: Record<string, string> = {
    borrow_request: 'Borrowing request',
    request_approved: 'Request approved',
    request_rejected: 'Request declined',
    loan_due: 'Loan due',
    loan_returned: 'Loan return',
    message: 'New message',
    report_update: 'Report update',
    reward: 'Reward',
  }
  return labels[type] ?? 'Account update'
}

export default function NotificationsPage({
  onUnreadCount,
}: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let activeRequest = true
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      unreadOnly: String(filter === 'unread'),
    })
    if (page === 1) {
      setLoading(true)
      setLoadingMore(false)
    }
    else setLoadingMore(true)
    setError('')

    void api
      .get<{
        notifications: Notification[]
        unreadCount: number
        pagination: { pages: number }
      }>(`/notifications?${params.toString()}`)
      .then((result) => {
        if (activeRequest) {
          setNotifications((current) =>
            page === 1 ? result.notifications : [...current, ...result.notifications],
          )
          setUnreadCount(result.unreadCount)
          setPages(result.pagination.pages)
          onUnreadCount(result.unreadCount)
        }
      })
      .catch((requestError: unknown) => {
        if (activeRequest) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Unable to load notifications. Check your connection and try again.',
          )
        }
      })
      .finally(() => {
        if (activeRequest) {
          if (page === 1) setLoading(false)
          else setLoadingMore(false)
        }
      })

    return () => {
      activeRequest = false
    }
  }, [filter, onUnreadCount, page, retry])

  async function markAsRead(notification: Notification) {
    if (notification.readAt || busyId) return
    setBusyId(notification._id)
    setActionError('')
    try {
      const result = await api.patch<{ notification: Notification }>(
        `/notifications/${notification._id}/read`,
      )
      setNotifications((current) => current.map((entry) =>
        entry._id === notification._id ? result.notification : entry,
      ))
      const nextCount = Math.max(0, unreadCount - 1)
      setUnreadCount(nextCount)
      onUnreadCount(nextCount)
      if (filter === 'unread') {
        setNotifications([])
        setPage(1)
        setRetry((value) => value + 1)
      }
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to mark this notification as read.',
      )
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="content narrow">
      <div className="page-title">
        <div>
          <div className="kicker">LENDLOOP</div>
          <h1>Notifications</h1>
          <p>Updates about your loans, messages, and account.</p>
        </div>
        <span className="unread-summary">{unreadCount} unread</span>
      </div>
      <div className="notification-filters" role="tablist" aria-label="Notification filter">
        <button
          aria-selected={filter === 'all'}
          className={filter === 'all' ? 'active' : ''}
          onClick={() => {setFilter('all');setPage(1)}}
          role="tab"
        >
          All
        </button>
        <button
          aria-selected={filter === 'unread'}
          className={filter === 'unread' ? 'active' : ''}
          onClick={() => {setFilter('unread');setPage(1)}}
          role="tab"
        >
          Unread
        </button>
      </div>
      {actionError && <div className="form-error notification-error" role="alert">{actionError}</div>}
      {loading && <div className="items-state" role="status">Loading notifications…</div>}
      {!loading && error && (
        <div className="items-state items-error" role="alert">
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => setRetry((value) => value + 1)}>Try again</button>
        </div>
      )}
      {!loading && !error && notifications.length === 0 && (
        <div className="items-state">
          <strong>{filter === 'unread' ? 'You are all caught up.' : 'No notifications yet.'}</strong>
          <p>We will let you know when there is an update to your LendLoop activity.</p>
        </div>
      )}
      {!loading && !error && notifications.length > 0 && (
        <>
          <div className="notification-list">
            {notifications.map((notification) => (
              <article
                className={`notification ${notification.readAt ? '' : 'unread'}`}
                key={notification._id}
              >
                <span className={`notification-mark ${notification.readAt ? 'read' : ''}`} aria-hidden="true">
                  {notificationLabel(notification.type).slice(0, 1)}
                </span>
                <div className="notification-copy">
                  <div className="notification-heading">
                    <strong>{notification.title}</strong>
                    <span>{notificationLabel(notification.type)}</span>
                  </div>
                  <p>{notification.message}</p>
                  <time dateTime={notification.createdAt}>{formatNotificationDate(notification.createdAt)}</time>
                </div>
                {!notification.readAt && (
                  <button
                    aria-label={`Mark as read: ${notification.title}`}
                    className="mark-read"
                    disabled={busyId === notification._id}
                    onClick={() => void markAsRead(notification)}
                  >
                    {busyId === notification._id ? 'Saving…' : 'Mark read'}
                  </button>
                )}
              </article>
            ))}
          </div>
          {!loadingMore && page < pages && (
            <button className="btn-secondary load-more" onClick={() => setPage((value) => value + 1)}>
              Load more
            </button>
          )}
          {loadingMore && <div className="items-state" role="status">Loading more notifications…</div>}
        </>
      )}
    </div>
  )
}
