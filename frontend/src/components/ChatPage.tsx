import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError, api } from '../lib/api'

type Participant = {
  _id: string
  name: string
  avatarUrl: string
}

type ChatConversation = {
  _id: string
  participants: Participant[]
  loan: {
    item: { title: string; imageUrl: string } | null
    dueAt: string
    status: string
  } | null
  lastMessageAt: string | null
}

type ChatMessage = {
  _id: string
  body: string
  sender: Participant
  createdAt: string
}

type ChatPageProps = {
  userId: string
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function messageTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function ChatPage({ userId }: ChatPageProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [sending, setSending] = useState(false)
  const [listError, setListError] = useState('')
  const [messageLoadError, setMessageLoadError] = useState('')
  const [olderError, setOlderError] = useState('')
  const [sendError, setSendError] = useState('')
  const [readError, setReadError] = useState('')
  const [retryList, setRetryList] = useState(0)
  const [retryMessages, setRetryMessages] = useState(0)
  const [messagePage, setMessagePage] = useState(1)
  const [messagePages, setMessagePages] = useState(1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const selectedIdRef = useRef('')
  const shouldScrollToBottom = useRef(true)

  useEffect(() => {
    let active = true
    setLoadingConversations(true)
    setListError('')
    void api
      .get<{ conversations: ChatConversation[] }>('/conversations')
      .then((result) => {
        if (active) {
          setConversations(result.conversations)
          setSelectedId((current) => {
            const next = current && result.conversations.some((conversation) => conversation._id === current)
              ? current
              : result.conversations[0]?._id ?? ''
            selectedIdRef.current = next
            return next
          })
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setListError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Unable to load conversations. Check your connection and try again.',
          )
        }
      })
      .finally(() => {
        if (active) setLoadingConversations(false)
      })

    return () => {
      active = false
    }
  }, [retryList])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      setLoadingMessages(false)
      return
    }

    let active = true
    setMessages([])
    setMessagePage(1)
    setMessagePages(1)
    setLoadingMessages(true)
    setMessageLoadError('')
    setOlderError('')
    setSendError('')
    setReadError('')
    void api
      .get<{ messages: ChatMessage[]; pagination: { pages: number } }>(
        `/conversations/${selectedId}/messages?page=1&limit=100`,
      )
      .then((result) => {
        if (active) {
          setMessages(result.messages)
          setMessagePages(result.pagination.pages)
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setMessageLoadError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Unable to load this conversation. Check your connection and try again.',
          )
        }
      })
      .finally(() => {
        if (active) setLoadingMessages(false)
      })

    void api.patch(`/conversations/${selectedId}/read`).catch((requestError: unknown) => {
      if (active) {
        setReadError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Messages loaded, but their read status could not be updated.',
        )
      }
    })

    return () => {
      active = false
    }
  }, [retryMessages, selectedId])

  useEffect(() => {
    if (shouldScrollToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    shouldScrollToBottom.current = true
  }, [messages])

  const selected = conversations.find((conversation) => conversation._id === selectedId)
  const otherParticipant = selected?.participants.find((participant) => participant._id !== userId)
  const loanItem = selected?.loan?.item

  async function loadOlderMessages() {
    if (!selectedId || messagePage >= messagePages || loadingOlder) return
    const conversationId = selectedId
    const nextPage = messagePage + 1
    setLoadingOlder(true)
    setOlderError('')
    shouldScrollToBottom.current = false
    try {
      const result = await api.get<{ messages: ChatMessage[]; pagination: { pages: number } }>(
        `/conversations/${conversationId}/messages?page=${nextPage}&limit=100`,
      )
      if (selectedIdRef.current !== conversationId) return
      setMessages((current) => [...result.messages, ...current])
      setMessagePage(nextPage)
      setMessagePages(result.pagination.pages)
    } catch (requestError) {
      if (selectedIdRef.current === conversationId) {
        shouldScrollToBottom.current = true
        setOlderError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Unable to load older messages.',
        )
      }
    } finally {
      if (selectedIdRef.current === conversationId) setLoadingOlder(false)
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !selectedId) return
    const conversationId = selectedId
    setSending(true)
    setSendError('')
    try {
      const result = await api.post<{ message: ChatMessage }>(
        `/conversations/${conversationId}/messages`,
        { body },
      )
      if (selectedIdRef.current !== conversationId) return
      setMessages((current) => [...current, result.message])
      setConversations((current) => current.map((conversation) =>
        conversation._id === conversationId
          ? { ...conversation, lastMessageAt: result.message.createdAt }
          : conversation,
      ))
      setDraft('')
    } catch (requestError) {
      if (selectedIdRef.current === conversationId) setSendError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to send your message. Check your connection and try again.',
      )
    } finally {
      setSending(false)
    }
  }

  function selectConversation(conversationId: string) {
    selectedIdRef.current = conversationId
    setSelectedId(conversationId)
    setDraft('')
    setLoadingOlder(false)
    setSendError('')
    setOlderError('')
    shouldScrollToBottom.current = true
  }

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <div className="kicker">LENDLOOP</div>
          <h1>Messages</h1>
          <p>Keep borrowing details and conversations in one safe place.</p>
        </div>
      </div>
      {loadingConversations && <div className="items-state" role="status">Loading conversations…</div>}
      {!loadingConversations && listError && (
        <div className="items-state items-error" role="alert">
          <p>{listError}</p>
          <button className="btn-secondary" onClick={() => setRetryList((value) => value + 1)}>Try again</button>
        </div>
      )}
      {!loadingConversations && !listError && conversations.length === 0 && (
        <div className="items-state">
          <strong>No conversations yet.</strong>
          <p>When an owner approves a borrowing request, a private conversation will appear here.</p>
        </div>
      )}
      {!loadingConversations && !listError && conversations.length > 0 && (
        <div className="messages">
          <nav className="threads" aria-label="Conversations">
            {conversations.map((conversation) => {
              const participant = conversation.participants.find((entry) => entry._id !== userId)
              const title = participant?.name ?? 'LendLoop student'
              const itemTitle = conversation.loan?.item?.title ?? 'Borrowing conversation'
              return (
                <button
                  aria-current={selectedId === conversation._id ? 'true' : undefined}
                  className={`thread ${selectedId === conversation._id ? 'active' : ''}`}
                  key={conversation._id}
                  onClick={() => selectConversation(conversation._id)}
                >
                  {participant?.avatarUrl
                    ? <img className="avatar" src={participant.avatarUrl} alt="" />
                    : <span className="avatar">{initials(title)}</span>}
                  <span className="thread-info">
                    <strong>{title}</strong>
                    <span>{itemTitle}</span>
                  </span>
                  {conversation.lastMessageAt && <time>{messageTime(conversation.lastMessageAt)}</time>}
                </button>
              )
            })}
          </nav>
          <section className="conversation" aria-label="Selected conversation">
            {selected && (
              <>
                <div className="chat-head">
                  {otherParticipant?.avatarUrl
                    ? <img className="avatar" src={otherParticipant.avatarUrl} alt="" />
                    : <span className="avatar">{initials(otherParticipant?.name ?? 'Student')}</span>}
                  <div>
                    <strong>{otherParticipant?.name ?? 'LendLoop student'}</strong>
                    <small>{loanItem?.title ?? 'Borrowing conversation'}</small>
                  </div>
                </div>
                <div className="chat-body" aria-live="polite">
                  {messagePages > 1 && messagePage < messagePages && (
                    <button className="load-older" disabled={loadingOlder} onClick={() => void loadOlderMessages()}>
                      {loadingOlder ? 'Loading…' : 'Load older messages'}
                    </button>
                  )}
                  {loadingMessages && <div className="items-state" role="status">Loading messages…</div>}
                  {!loadingMessages && messageLoadError && (
                    <div className="chat-error" role="alert">
                      <span>{messageLoadError}</span>
                      <button onClick={() => setRetryMessages((value) => value + 1)}>Retry</button>
                    </div>
                  )}
                  {olderError && (
                    <div className="chat-error" role="alert">
                      <span>{olderError}</span>
                      <button onClick={() => void loadOlderMessages()}>Retry</button>
                    </div>
                  )}
                  {!loadingMessages && !messageLoadError && messages.length === 0 && (
                    <p className="chat-empty">This is the start of your conversation.</p>
                  )}
                  {!loadingMessages && !messageLoadError && messages.map((message) => {
                    const mine = message.sender._id === userId
                    return (
                      <div className={`message-row ${mine ? 'mine' : 'theirs'}`} key={message._id}>
                        {!mine && <span className="message-sender">{message.sender.name}</span>}
                        <div className={`bubble ${mine ? 'mine' : 'theirs'}`}>{message.body}</div>
                        <time aria-label={new Date(message.createdAt).toLocaleString()}>
                          {messageTime(message.createdAt)}
                        </time>
                      </div>
                    )
                  })}
                  {readError && <p className="chat-read-error" role="status">{readError}</p>}
                  <div ref={bottomRef} />
                </div>
                <form className="message-input chat-composer" onSubmit={sendMessage}>
                  <input
                    aria-label="Write a message"
                    maxLength={2000}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write a message..."
                    value={draft}
                  />
                  <button disabled={sending || !draft.trim()} aria-label="Send message">
                    {sending ? '…' : 'Send'}
                  </button>
                  {sendError && (
                    <span className="chat-send-error" role="alert">{sendError}</span>
                  )}
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
