import { useEffect, useState } from 'react'
import { ApiError, api, type LendingItem, type Student } from '../lib/api'

type Person = {
  _id: string
  name: string
  avatarUrl: string
}

type BorrowingRequest = {
  _id: string
  item: Pick<LendingItem, '_id' | 'title' | 'imageUrl' | 'category'> | null
  borrower: Person
  owner: Person
  proposedReturnDate: string
  message: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'returned'
  createdAt: string
}

type Loan = {
  _id: string
  item: Pick<LendingItem, '_id' | 'title' | 'imageUrl' | 'category'> | null
  borrower: Person
  owner: Person
  startedAt: string
  dueAt: string
  returnedAt: string | null
  status: 'active' | 'return_requested' | 'returned'
}

type MyLoansPageProps = {
  user: Student
  onUserUpdated: (user: Student) => void
}

type Tab = 'borrowing' | 'requests' | 'lending'

const requestStatusLabels: Record<BorrowingRequest['status'], string> = {
  pending: 'Awaiting owner',
  approved: 'Approved',
  rejected: 'Declined',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

const loanStatusLabels: Record<Loan['status'], string> = {
  active: 'Active loan',
  return_requested: 'Return requested',
  returned: 'Returned',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ItemThumb({ item }: { item: BorrowingRequest['item'] }) {
  return item?.imageUrl
    ? <img className="loan-thumb" src={item.imageUrl} alt="" />
    : <div className="loan-thumb loan-thumb-placeholder" aria-hidden="true">LL</div>
}

export default function MyLoansPage({ user, onUserUpdated }: MyLoansPageProps) {
  const [requests, setRequests] = useState<BorrowingRequest[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [tab, setTab] = useState<Tab>('borrowing')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busyId, setBusyId] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void Promise.all([
      api.get<{ requests: BorrowingRequest[] }>('/borrow-requests?page=1&limit=100'),
      api.get<{ loans: Loan[] }>('/loans'),
    ])
      .then(([requestResult, loanResult]) => {
        if (active) {
          setRequests(requestResult.requests)
          setLoans(loanResult.loans)
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Unable to load your borrowing activity. Check your connection and try again.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [retry])

  async function refreshAccount() {
    try {
      const result = await api.get<{ user: Student }>('/auth/me')
      onUserUpdated(result.user)
    } catch {
      setActionError('The action completed, but your account summary could not be refreshed.')
    }
  }

  async function performAction(
    id: string,
    action: () => Promise<unknown>,
    message: string,
  ) {
    setBusyId(id)
    setActionError('')
    setFeedback('')
    try {
      await action()
      setFeedback(message)
      setRetry((value) => value + 1)
      void refreshAccount()
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to complete this action. Check your connection and try again.',
      )
    } finally {
      setBusyId('')
    }
  }

  const myRequests = requests.filter((request) => request.borrower._id === user.id)
  const incomingRequests = requests.filter((request) => request.owner._id === user.id)
  const borrowedLoans = loans.filter((loan) => loan.borrower._id === user.id)
  const lentLoans = loans.filter((loan) => loan.owner._id === user.id)

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <div className="kicker">LENDLOOP</div>
          <h1>My loans</h1>
          <p>Track borrowing requests, incoming requests, and active loans.</p>
        </div>
      </div>
      {actionError && <div className="form-error loan-feedback" role="alert">{actionError}</div>}
      {feedback && <div className="form-success loan-feedback" role="status">{feedback}</div>}
      <div className="tabs loan-tabs" role="tablist" aria-label="Borrowing activity">
        <button
          aria-selected={tab === 'borrowing'}
          className={tab === 'borrowing' ? 'active' : ''}
          onClick={() => setTab('borrowing')}
          role="tab"
        >
          Borrowing <span>{myRequests.length + borrowedLoans.length}</span>
        </button>
        <button
          aria-selected={tab === 'requests'}
          className={tab === 'requests' ? 'active' : ''}
          onClick={() => setTab('requests')}
          role="tab"
        >
          Requests to me <span>{incomingRequests.filter((request) => request.status === 'pending').length}</span>
        </button>
        <button
          aria-selected={tab === 'lending'}
          className={tab === 'lending' ? 'active' : ''}
          onClick={() => setTab('lending')}
          role="tab"
        >
          Lending <span>{lentLoans.length}</span>
        </button>
      </div>
      {loading && <div className="items-state" role="status">Loading borrowing activity…</div>}
      {!loading && error && (
        <div className="items-state items-error" role="alert">
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => setRetry((value) => value + 1)}>Try again</button>
        </div>
      )}
      {!loading && !error && tab === 'borrowing' && (
        <>
          <section className="loan-section">
            <h2>Requests you have made</h2>
            {myRequests.length === 0 ? (
              <p className="empty-note">You have not requested an item yet.</p>
            ) : myRequests.map((request) => (
              <article className="loan-card request-card" key={request._id}>
                <ItemThumb item={request.item} />
                <div className="loan-card-main">
                  <span className={`pill ${request.status === 'approved' ? 'active-pill' : request.status === 'pending' ? 'pending' : ''}`}>
                    {requestStatusLabels[request.status]}
                  </span>
                  <h3>{request.item?.title ?? 'Listing no longer available'}</h3>
                  <p>Owner: {request.owner.name}</p>
                  {request.message && <p className="request-message">“{request.message}”</p>}
                </div>
                <div className="loan-date">
                  <small>PROPOSED RETURN</small>
                  <strong>{formatDate(request.proposedReturnDate)}</strong>
                  <span>Requested {formatDate(request.createdAt)}</span>
                </div>
              </article>
            ))}
          </section>
          <section className="loan-section">
            <h2>Items you are borrowing</h2>
            {borrowedLoans.length === 0 ? (
              <p className="empty-note">Approved loans will appear here.</p>
            ) : borrowedLoans.map((loan) => (
              <LoanCard
                busy={busyId === loan._id}
                key={loan._id}
                loan={loan}
                viewerIsBorrower
                onAction={() => void performAction(
                  loan._id,
                  () => api.post(`/loans/${loan._id}/return`),
                  'Return request sent to the owner.',
                )}
              />
            ))}
          </section>
        </>
      )}
      {!loading && !error && tab === 'requests' && (
        <section className="loan-section">
          <h2>Requests for your items</h2>
          {incomingRequests.length === 0 ? (
            <p className="empty-note">You do not have any borrowing requests.</p>
          ) : incomingRequests.map((request) => (
            <article className="loan-card request-card" key={request._id}>
              <ItemThumb item={request.item} />
              <div className="loan-card-main">
                <span className={`pill ${request.status === 'pending' ? 'pending' : request.status === 'approved' ? 'active-pill' : ''}`}>
                  {requestStatusLabels[request.status]}
                </span>
                <h3>{request.item?.title ?? 'Listing no longer available'}</h3>
                <p>Requested by {request.borrower.name}</p>
                {request.message && <p className="request-message">“{request.message}”</p>}
              </div>
              <div className="loan-date">
                <small>PROPOSED RETURN</small>
                <strong>{formatDate(request.proposedReturnDate)}</strong>
                <span>Requested {formatDate(request.createdAt)}</span>
              </div>
              {request.status === 'pending' && (
                <div className="request-actions">
                  <button
                    className="btn-secondary"
                    disabled={busyId === request._id}
                    onClick={() => void performAction(
                      request._id,
                      () => api.patch(`/borrow-requests/${request._id}/decision`, { decision: 'reject' }),
                      'Request declined.',
                    )}
                  >
                    {busyId === request._id ? 'Please wait…' : 'Decline'}
                  </button>
                  <button
                    className="btn-primary"
                    disabled={busyId === request._id}
                    onClick={() => void performAction(
                      request._id,
                      () => api.patch(`/borrow-requests/${request._id}/decision`, { decision: 'approve' }),
                      'Request approved. The loan is now active.',
                    )}
                  >
                    {busyId === request._id ? 'Please wait…' : 'Approve'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
      {!loading && !error && tab === 'lending' && (
        <section className="loan-section">
          <h2>Items you have lent</h2>
          {lentLoans.length === 0 ? (
            <p className="empty-note">Loans for your listings will appear here.</p>
          ) : lentLoans.map((loan) => (
            <LoanCard
              busy={busyId === loan._id}
              key={loan._id}
              loan={loan}
              viewerIsBorrower={false}
              onAction={() => void performAction(
                loan._id,
                () => api.patch(`/loans/${loan._id}/return`),
                'Return confirmed. The loan has been closed.',
              )}
            />
          ))}
        </section>
      )}
    </div>
  )
}

function LoanCard({
  loan,
  viewerIsBorrower,
  busy,
  onAction,
}: {
  loan: Loan
  viewerIsBorrower: boolean
  busy: boolean
  onAction: () => void
}) {
  const canRequestReturn = viewerIsBorrower && loan.status === 'active'
  const canConfirmReturn = !viewerIsBorrower && loan.status === 'return_requested'
  const showAction = canRequestReturn || canConfirmReturn

  return (
    <article className="loan-card request-card">
      <ItemThumb item={loan.item} />
      <div className="loan-card-main">
        <span className={`pill ${loan.status === 'returned' ? 'active-pill' : loan.status === 'return_requested' ? 'pending' : ''}`}>
          {loanStatusLabels[loan.status]}
        </span>
        <h3>{loan.item?.title ?? 'Listing no longer available'}</h3>
        <p>{viewerIsBorrower ? `Lent by ${loan.owner.name}` : `Borrowed by ${loan.borrower.name}`}</p>
      </div>
      <div className="loan-date">
        <small>{loan.status === 'returned' ? 'RETURNED' : 'DUE DATE'}</small>
        <strong>{formatDate(loan.status === 'returned' && loan.returnedAt ? loan.returnedAt : loan.dueAt)}</strong>
        {loan.status !== 'returned' && <span>Started {formatDate(loan.startedAt)}</span>}
      </div>
      {showAction && (
        <button className="btn-primary loan-action" disabled={busy} onClick={onAction}>
          {busy ? 'Please wait…' : canRequestReturn ? 'Request return' : 'Confirm return'}
        </button>
      )}
    </article>
  )
}
