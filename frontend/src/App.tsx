import { useState, type ReactNode } from 'react'
import { useCallback, useEffect } from 'react'
import AuthScreen from './components/AuthScreen'
import { ApiError, api, type Student } from './lib/api'

type Page = 'Home' | 'Discover' | 'My loans' | 'Messages' | 'Notifications' | 'Profile' | 'Reports'

const photos = [
  'https://images.unsplash.com/photo-1646911996830-187b66019a2d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1607102291356-76abe1f5fdae?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515940279136-2f419eea8051?auto=format&fit=crop&w=900&q=80',
]

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

const items = [
  { name: 'MacBook Air M1', owner: 'Miguel Santos', meta: 'Electronics · 3 days', image: photos[0], tag: 'Available now' },
  { name: 'Sony WH-1000XM4', owner: 'Bea Mendoza', meta: 'Electronics · 2 days', image: photos[1], tag: 'Available tomorrow' },
  { name: 'Fujifilm X-T20', owner: 'Paolo Reyes', meta: 'Photography · 4 days', image: photos[2], tag: 'Available now' },
]

function ItemCard({ item, onOpen }: { item: typeof items[number]; onOpen: () => void }) {
  return <article className="item-card">
    <div className="image-wrap"><img src={item.image} alt={item.name} /><span className="availability"><i />{item.tag}</span></div>
    <div className="item-body">
      <div className="eyebrow">{item.meta}</div>
      <div className="item-title">{item.name}</div>
      <div className="owner"><span>{item.owner.split(' ').map(x => x[0]).join('')}</span><div><strong>{item.owner}</strong><small>Verified student</small></div></div>
      <button className="view-link" onClick={onOpen}>View item <Icon name="arrow" size={16}/></button>
    </div>
  </article>
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
  return <Dashboard user={user} onLogout={signOut} />
}

function Dashboard({
  user,
  onLogout,
}: {
  user: Student
  onLogout: () => void
}) {
  const [page, setPage] = useState<Page>('Home')
  const [detail, setDetail] = useState(false)
  const [requested, setRequested] = useState(false)
  const [mobile, setMobile] = useState(false)
  const nav: { page: Page; icon: string }[] = [
    { page: 'Home', icon: 'home' }, { page: 'Discover', icon: 'search' }, { page: 'My loans', icon: 'loans' },
    { page: 'Messages', icon: 'chat' }, { page: 'Notifications', icon: 'bell' }, { page: 'Profile', icon: 'user' }, { page: 'Reports', icon: 'flag' }
  ]
  const go = (p: Page) => { setPage(p); setDetail(false); setMobile(false) }

  return <div className="app-shell">
    <aside className={mobile ? 'sidebar open' : 'sidebar'}>
      <div className="brand" onClick={() => go('Home')}><div className="brand-mark">L</div><div>Lend<span>Loop</span></div></div>
      <nav>
        <div className="nav-label">MENU</div>
        {nav.slice(0, 6).map(n => <button key={n.page} className={page === n.page ? 'nav-item active' : 'nav-item'} onClick={() => go(n.page)}>
          <Icon name={n.icon}/><span>{n.page}</span>{n.page === 'Notifications' && <b>3</b>}
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
          <button className="icon-btn" onClick={() => go('Notifications')}><Icon name="bell"/><i /></button>
          <Button onClick={() => go('Discover')}><Icon name="plus" size={17}/> List an item</Button>
        </div>
      </header>

      {page === 'Home' && !detail && <div className="content">
        <section className="welcome">
          <div><div className="kicker">ATENEO DE NAGA UNIVERSITY</div><h1>Good morning, {user.name.split(' ')[0]}.</h1><p>What do you need today? Borrow from students you know and trust.</p></div>
          <div className="trust-card"><div className="score-ring">86</div><div><span>Great standing</span><strong>Your LoopScore</strong><small>Top 15% of borrowers</small></div><Icon name="arrow"/></div>
        </section>
        <div className="search-box"><Icon name="search" size={22}/><input placeholder="Search cameras, calculators, books, and more..." /><Button onClick={() => go('Discover')}>Search</Button></div>
        <section className="stats-grid">
          <div className="stat-card"><div className="stat-icon green"><Icon name="loans"/></div><div><small>BORROWING LIMIT</small><strong>2 <span>of 5 items</span></strong><div className="progress"><i style={{width:'40%'}} /></div></div></div>
          <div className="stat-card"><div className="stat-icon orange">★</div><div><small>LOOP POINTS</small><strong>1,240 <span>points</span></strong><p>60 pts until your next badge</p></div></div>
          <div className="due-card"><div><small>NEXT DUE</small><strong>Scientific Calculator</strong><p>Tomorrow · 5:00 PM</p></div><span>1 day</span></div>
        </section>
        <section className="section-head"><div><h2>Recently listed</h2><p>Fresh finds from the ADNU community</p></div><button onClick={() => go('Discover')}>Browse all <Icon name="arrow" size={16}/></button></section>
        <div className="items-grid">{items.map(item => <ItemCard item={item} key={item.name} onOpen={() => {setDetail(true); setPage('Discover')}} />)}</div>
        <div className="activity">
          <div className="section-head compact"><div><h2>Recent activity</h2></div><button onClick={() => go('Notifications')}>View all</button></div>
          <div className="activity-row"><div className="activity-icon"><Icon name="check"/></div><div><strong>Your request was approved</strong><p>Miguel approved your request for “Scientific Calculator”.</p></div><time>12 min ago</time></div>
          <div className="activity-row"><div className="activity-icon blue"><Icon name="chat"/></div><div><strong>New message from Bea</strong><p>“Sure! I can meet you at the library...”</p></div><time>1 hr ago</time></div>
        </div>
      </div>}

      {page === 'Discover' && !detail && <div className="content"><PageTitle title="Discover items" text="Find what you need from the ADNU community." />
        <div className="search-box"><Icon name="search"/><input placeholder="Search all items..." /><Button>Search</Button></div>
        <div className="filters"><button className="selected">All items</button><button>Electronics</button><button>Books</button><button>School supplies</button><button>Photography</button></div>
        <div className="results-line"><strong>42 items available</strong><span>Sorted by: Newest</span></div>
        <div className="items-grid">{items.concat(items.slice(0,2)).map((item, i) => <ItemCard item={item} key={item.name+i} onOpen={() => setDetail(true)} />)}</div>
      </div>}

      {detail && <div className="content detail-page">
        <button className="back" onClick={() => setDetail(false)}>← Back to discover</button>
        <div className="detail-grid">
          <img className="detail-image" src={photos[0]} alt="MacBook Air M1"/>
          <div className="detail-info"><div className="availability inline"><i/>Available now</div><div className="eyebrow">ELECTRONICS</div><h1>MacBook Air M1</h1><p className="description">A reliable MacBook Air in excellent condition. Perfect for presentations, coding sessions, or finishing a paper on campus.</p>
            <div className="lender"><div className="avatar">MS</div><div><small>LENT BY</small><strong>Miguel Santos <span>✓</span></strong><p>LoopScore 92 · 18 successful lends</p></div></div>
            <div className="request-box"><label>Proposed return date</label><input type="date" defaultValue="2026-02-27"/><div className="limit-note"><Icon name="loans"/><span>This will use <strong>1 of your 3 remaining</strong> borrowing slots.</span></div>
              <Button className="full" onClick={() => setRequested(true)}>Request to borrow</Button>
            </div>
          </div>
        </div>
      </div>}

      {page === 'My loans' && <div className="content"><PageTitle title="My loans" text="Track requests, active loans, and lending activity." />
        <div className="tabs"><button className="active">Borrowing <span>2</span></button><button>Lending <span>1</span></button></div>
        <div className="loan-card"><img src={photos[0]}/><div><span className="pill active-pill">ACTIVE LOAN</span><h3>Scientific Calculator</h3><p>Borrowed from Miguel Santos</p></div><div className="loan-date"><small>RETURN BY</small><strong>Tomorrow, 5:00 PM</strong><span>Due in 1 day</span></div><Button>Confirm return</Button></div>
        <div className="loan-card"><img src={photos[2]}/><div><span className="pill pending">PENDING</span><h3>Fujifilm X-T20</h3><p>Requested from Paolo Reyes</p></div><div className="loan-date"><small>REQUESTED</small><strong>Today, 9:42 AM</strong><span>Awaiting response</span></div><Button secondary>Cancel request</Button></div>
      </div>}

      {page === 'Messages' && <div className="content"><PageTitle title="Messages" text="Keep borrowing details in one safe place."/><div className="messages">
        <div className="threads"><div className="thread active"><div className="avatar">BM</div><div><strong>Bea Mendoza</strong><p>Sure! I can meet you...</p></div><time>10:34</time></div><div className="thread"><div className="avatar gray">MS</div><div><strong>Miguel Santos</strong><p>Thanks for returning it!</p></div></div></div>
        <div className="conversation"><div className="chat-head"><div className="avatar">BM</div><div><strong>Bea Mendoza</strong><small>About Sony WH-1000XM4</small></div></div><div className="chat-body"><div className="bubble theirs">Hi Alyssa! The headphones are available tomorrow.</div><div className="bubble mine">Great, could we meet by the library at noon?</div><div className="bubble theirs">Sure! I can meet you at the library entrance.</div></div><div className="message-input"><input placeholder="Write a message..."/><button><Icon name="send"/></button></div></div>
      </div></div>}

      {page === 'Notifications' && <div className="content narrow"><PageTitle title="Notifications" text="Updates about your loans and account."/>
        {['Your request was approved|Miguel approved “Scientific Calculator”.|12 min ago','Upcoming return date|Your calculator is due tomorrow at 5:00 PM.|1 hr ago','You earned 50 Loop Points|On-time returns build your score and unlock badges.|Yesterday'].map((n,i)=>{const a=n.split('|');return <div className={`notification ${i===0?'unread':''}`} key={n}><div className={`activity-icon ${i===1?'orange':''}`}><Icon name={i===1?'bell':'check'}/></div><div><strong>{a[0]}</strong><p>{a[1]}</p></div><time>{a[2]}</time></div>})}
      </div>}

      {page === 'Profile' && <div className="content"><PageTitle title="Student profile" text="Your reputation across the LendLoop community."/>
        <div className="profile-grid"><section className="profile-card"><div className="big-avatar">AS</div><h2>Alyssa Sy</h2><p>alyssa.sy@gbox.adnu.edu.ph</p><span className="verified">✓ University verified</span><hr/><div className="profile-stats"><div><strong>12</strong><small>Items lent</small></div><div><strong>8</strong><small>Items borrowed</small></div><div><strong>100%</strong><small>On-time</small></div></div></section>
        <section className="reputation"><h2>Your reputation</h2><div className="score-block"><div className="score-ring large">86</div><div><strong>Great standing</strong><p>Your reliable borrowing history puts you in the top 15%.</p></div></div><div className="badge-row"><div>★<span>1,240<br/><small>Loop Points</small></span></div><div>✓<span>Trusted<br/><small>Lender badge</small></span></div><div>5<span>2 of 5<br/><small>Borrowing limit</small></span></div></div></section></div>
      </div>}

      {page === 'Reports' && <div className="content"><PageTitle title="Reports & OSA referrals" text="Raise a concern safely. Serious cases can be referred to the Office of Student Affairs."/>
        <div className="report-grid"><section className="form-card"><h2>Submit a report</h2><label>Report category</label><select defaultValue=""><option value="" disabled>Select a category</option><option>Item not returned</option><option>Damaged item</option><option>Inappropriate behavior</option></select><label>Related transaction</label><select><option>Scientific Calculator — #LL-1024</option></select><label>Tell us what happened</label><textarea placeholder="Share relevant details..."/><Button>Submit report</Button></section>
        <section className="osa-card"><span className="pill active-pill">ADMIN VIEW</span><h2>OSA referral queue</h2><p>Only designated staff can access referral details.</p><div className="report-row"><div><strong>#RPT-024 · Item not returned</strong><p>Canon EOS 80D · 3 days overdue</p></div><span className="pill pending">UNDER REVIEW</span></div><div className="report-row"><div><strong>#RPT-019 · Damaged item</strong><p>Laboratory coat · Referred Feb 18</p></div><span className="pill">REFERRED TO OSA</span></div></section></div>
      </div>}
    </main>

    {requested && <div className="modal-backdrop"><div className="success-modal"><div className="success-icon"><Icon name="check" size={28}/></div><h2>Request sent</h2><p>Miguel has been notified. You’ll get an update as soon as they respond.</p><div className="modal-actions"><Button secondary onClick={() => setRequested(false)}>Keep browsing</Button><Button onClick={() => {setRequested(false);setDetail(false);setPage('My loans')}}>View my loans</Button></div></div></div>}
  </div>
}

function PageTitle({title, text}:{title:string;text:string}) {
  return <div className="page-title"><div><div className="kicker">LENDLOOP</div><h1>{title}</h1><p>{text}</p></div></div>
}
