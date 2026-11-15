import { useState, type ReactNode } from 'react'
import { useCallback, useEffect } from 'react'
import AuthScreen from './components/AuthScreen'
import ChatPage from './components/ChatPage'
import ItemBrowser from './components/ItemBrowser'
import ItemDetailsPage from './components/ItemDetailsPage'
import ListingForm from './components/ListingForm'
import MyLoansPage from './components/MyLoansPage'
import MyListingsPage from './components/MyListingsPage'
import NotificationsPage from './components/NotificationsPage'
import ProfilePage from './components/ProfilePage'
import ReportPage from './components/ReportPage'
import { ApiError, api, type LendingItem, type ReportTarget, type Student } from './lib/api'

type Page = 'Home' | 'Discover' | 'My loans' | 'My listings' | 'Messages' | 'Notifications' | 'Profile' | 'Reports' | 'Create listing'

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    loans: <><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M8 11h8M8 15h5"/></>,
    chat: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-5A8 8 0 1 1 21 15Z"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    flag: <><path d="M5 21V4m0 1c6-4 8 4 14 0v10c-6 4-8-4-14 0"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    send: <path d="m22 2-7 20-4-9-9-4Z M22 2 11 13"/>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>
}

function Button({ children, secondary, onClick, className = '' }: { children: ReactNode; secondary?: boolean; onClick?: () => void; className?: string }) {
  return <button onClick={onClick} className={`${secondary ? 'btn-secondary' : 'btn-primary'} ${className}`}>{children}</button>
}

export default function App() {
  const [user, setUser] = useState<Student | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [sessionError, setSessionError] = useState('')

  const loadSession = useCallback(async () => {
    setLoadingSession(true)
    setSessionError('')
    try {
      const result = await api.get<{ user: Student }>('/auth/me')
      setUser(result.user)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null)
      } else {
        setSessionError(
          error instanceof Error
            ? error.message
            : 'Unable to connect to the LendLoop API.',
        )
      }
    } finally {
      setLoadingSession(false)
    }
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  async function signOut() {
    try {
      await api.post('/auth/logout')
      setUser(null)
    } catch (error) {
      setSessionError(
        error instanceof Error ? error.message : 'Unable to sign out.',
      )
    }
  }

  if (loadingSession) {
    return <main className="auth-loading" aria-live="polite">Checking your session…</main>
  }
  if (sessionError) {
    return (
      <main className="auth-loading">
        <div className="form-error" role="alert">{sessionError}</div>
        <button className="btn-primary" onClick={() => void loadSession()}>
          Retry connection
        </button>
      </main>
    )
  }
  if (!user) return <AuthScreen onAuthenticated={setUser} />
  return <Dashboard user={user} onLogout={signOut} onUserUpdated={setUser} />
}

function Dashboard({
  user,
  onLogout,
  onUserUpdated,
}: {
  user: Student
  onLogout: () => void
  onUserUpdated: (user: Student) => void
}) {
  const [page, setPage] = useState<Page>('Home')
  const [selectedItem, setSelectedItem] = useState<LendingItem | null>(null)
  const [discoverQuery, setDiscoverQuery] = useState('')
  const [listingRefresh, setListingRefresh] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const [mobile, setMobile] = useState(false)
  const nav: { page: Page; icon: string }[] = [
    { page: 'Home', icon: 'home' }, { page: 'Discover', icon: 'search' }, { page: 'My loans', icon: 'loans' },
    { page: 'My listings', icon: 'loans' },
    { page: 'Messages', icon: 'chat' }, { page: 'Notifications', icon: 'bell' }, { page: 'Profile', icon: 'user' }, { page: 'Reports', icon: 'flag' }
  ]
  const go = (p: Page) => { setPage(p); setSelectedItem(null); if (p !== 'Reports') setReportTarget(null); setMobile(false) }
  const openItem = (item: LendingItem) => { setSelectedItem(item); setPage('Discover') }
  const openReport = (target: ReportTarget) => { setReportTarget(target); setPage('Reports'); setSelectedItem(null); setMobile(false) }

  return <div className="app-shell">
    <aside className={mobile ? 'sidebar open' : 'sidebar'}>
      <div className="brand" onClick={() => go('Home')}><div className="brand-mark">L</div><div>Lend<span>Loop</span></div></div>
      <nav>
        <div className="nav-label">MENU</div>
        {nav.slice(0, 7).map(n => <button key={n.page} className={page === n.page ? 'nav-item active' : 'nav-item'} onClick={() => go(n.page)}>
          <Icon name={n.icon}/><span>{n.page}</span>{n.page === 'Notifications' && unreadNotifications > 0 && <b>{unreadNotifications}</b>}
        </button>)}
        <div className="nav-label support">SUPPORT</div>
        <button className={page === 'Reports' ? 'nav-item active' : 'nav-item'} onClick={() => go('Reports')}><Icon name="flag"/><span>Reports & OSA</span></button>
      </nav>
      <div className="sidebar-profile">
        <div className="avatar">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.email}</small></div><button className="sign-out" onClick={onLogout}>Sign out</button>
      </div>
    </aside>

    <main>
      <header>
        <button className="menu-btn" onClick={() => setMobile(!mobile)}><Icon name="menu"/></button>
        <div className="mobile-brand">LendLoop</div>
        <div className="header-actions">
          <button aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`} className="icon-btn" onClick={() => go('Notifications')}><Icon name="bell"/>{unreadNotifications > 0 && <i />}</button>
          <Button onClick={() => go('Create listing')}><Icon name="plus" size={17}/> List an item</Button>
        </div>
      </header>

      {page === 'Home' && <div className="content">
        <section className="welcome">
          <div><div className="kicker">ATENEO DE NAGA UNIVERSITY</div><h1>Good morning, {user.name.split(' ')[0]}.</h1><p>What do you need today? Borrow from students you know and trust.</p></div>
          <div className="trust-card"><div className="score-ring">{user.creditScore}</div><div><span>Current score</span><strong>Your LoopScore</strong><small>Based on confirmed loan activity</small></div><Icon name="arrow"/></div>
        </section>
        <form className="search-box" onSubmit={(event) => {event.preventDefault();go('Discover')}}><Icon name="search" size={22}/><input aria-label="Search items" onChange={(event) => setDiscoverQuery(event.target.value)} placeholder="Search cameras, calculators, books, and more..." value={discoverQuery} /><button className="btn-primary">Search</button></form>
        <section className="stats-grid">
          <div className="stat-card"><div className="stat-icon green"><Icon name="loans"/></div><div><small>ACTIVE BORROWINGS</small><strong>{user.activeBorrowingCount} <span>of 5 items</span></strong><div className="progress"><i style={{width:`${Math.min(user.activeBorrowingCount / 5, 1) * 100}%`}} /></div></div></div>
          <div className="stat-card"><div className="stat-icon orange">★</div><div><small>LOOP POINTS</small><strong>{user.rewardPoints.toLocaleString()} <span>points</span></strong><p>Earn points for eligible on-time returns.</p></div></div>
          <div className="due-card"><div><small>LOANS & RETURNS</small><strong>Manage your borrowing activity</strong><p>Review requests, loan dates, and returns.</p></div><button onClick={() => go('My loans')}>View loans</button></div>
        </section>
        <section className="section-head"><div><h2>Recently listed</h2><p>Fresh finds from the ADNU community</p></div><button onClick={() => go('Discover')}>Browse all <Icon name="arrow" size={16}/></button></section>
        <ItemBrowser compact onOpen={openItem} />
        <RecentActivity
          onUnreadCount={setUnreadNotifications}
          onViewAll={() => go('Notifications')}
        />
      </div>}

      {page === 'Discover' && !selectedItem && <div className="content"><PageTitle title="Discover items" text="Find what you need from the ADNU community." />
        <ItemBrowser initialQuery={discoverQuery} onOpen={openItem} />
      </div>}

      {page === 'Discover' && selectedItem && (
        <ItemDetailsPage
          activeBorrowingCount={user.activeBorrowingCount}
          itemId={selectedItem._id}
          onBack={() => setSelectedItem(null)}
          onReportTarget={openReport}
          onViewLoans={() => go('My loans')}
          userId={user.id}
        />
      )}

      {page === 'My listings' && (
        <MyListingsPage
          refreshToken={listingRefresh}
          onCreate={() => go('Create listing')}
        />
      )}
      {page === 'Create listing' && (
        <ListingForm
          onCancel={() => go('My listings')}
          onSaved={() => {
            setListingRefresh((value) => value + 1)
            go('My listings')
          }}
        />
      )}

      {page === 'My loans' && (
        <MyLoansPage
          onReportLoan={openReport}
          onUserUpdated={onUserUpdated}
          user={user}
        />
      )}

      {page === 'Messages' && <ChatPage userId={user.id} />}

      {page === 'Notifications' && (
        <NotificationsPage onUnreadCount={setUnreadNotifications} />
      )}

      {page === 'Profile' && <div className="content"><ProfilePage user={user} onUserUpdated={onUserUpdated} /></div>}

      {page === 'Reports' && (
        <ReportPage
          onBrowseItems={() => go('Discover')}
          onViewLoans={() => go('My loans')}
          target={reportTarget}
        />
      )}
    </main>

  </div>
}

function PageTitle({title, text}:{title:string;text:string}) {
  return <div className="page-title"><div><div className="kicker">LENDLOOP</div><h1>{title}</h1><p>{text}</p></div></div>
}

type ActivityNotification = {
  _id: string
  type: string
  title: string
  message: string
  createdAt: string
}

function RecentActivity({
  onUnreadCount,
  onViewAll,
}: {
  onUnreadCount: (count: number) => void
  onViewAll: () => void
}) {
  const [notifications, setNotifications] = useState<ActivityNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void api
      .get<{ notifications: ActivityNotification[]; unreadCount: number }>(
        '/notifications?page=1&limit=3',
      )
      .then((result) => {
        if (active) {
          setNotifications(result.notifications)
          onUnreadCount(result.unreadCount)
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Unable to load recent activity.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [onUnreadCount])

  return (
    <section className="activity">
      <div className="section-head compact">
        <div><h2>Recent activity</h2></div>
        <button onClick={onViewAll}>View all</button>
      </div>
      {loading && <div className="items-state" role="status">Loading recent activity…</div>}
      {!loading && error && <div className="items-state items-error" role="alert">{error}</div>}
      {!loading && !error && notifications.length === 0 && (
        <p className="empty-note">Your recent LendLoop activity will appear here.</p>
      )}
      {!loading && !error && notifications.map((notification) => {
        const isMessage = notification.type === 'message'
        const icon = isMessage
          ? 'chat'
          : notification.type === 'request_approved' || notification.type === 'loan_returned'
            ? 'check'
            : 'bell'
        const date = new Date(notification.createdAt)

        return (
          <div className="activity-row" key={notification._id}>
            <div className={`activity-icon ${isMessage ? 'blue' : ''}`}>
              <Icon name={icon} />
            </div>
            <div>
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
            </div>
            <time dateTime={notification.createdAt}>
              {date.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </time>
          </div>
        )
      })}
    </section>
  )
}
