import { useState, type FormEvent } from 'react'
import { ApiError, api, type ReportTarget } from '../lib/api'

const categories: Record<ReportTarget['targetType'], Array<[string, string]>> = {
  item: [
    ['inappropriate_listing', 'Inappropriate or misleading listing'],
    ['damaged_item', 'Damaged item'],
    ['item_not_returned', 'Item not returned'],
    ['other', 'Other concern'],
  ],
  user: [
    ['suspicious_user', 'Suspicious user'],
    ['inappropriate_behavior', 'Inappropriate behavior'],
    ['other', 'Other concern'],
  ],
  loan: [
    ['item_not_returned', 'Item not returned'],
    ['damaged_item', 'Damaged item'],
    ['borrowing_concern', 'Borrowing concern'],
    ['inappropriate_behavior', 'Inappropriate behavior'],
    ['other', 'Other concern'],
  ],
}

type ReportPageProps = {
  target: ReportTarget | null
  onBrowseItems: () => void
  onViewLoans: () => void
}

type SubmittedReport = {
  id: string
  category: string
  status: string
  createdAt: string
}

export default function ReportPage({
  target,
  onBrowseItems,
  onViewLoans,
}: ReportPageProps) {
  return (
    <div className="content narrow">
      <div className="page-title">
        <div>
          <div className="kicker">LENDLOOP SUPPORT</div>
          <h1>Report a concern</h1>
          <p>Reports are private and visible only to designated administrators.</p>
        </div>
      </div>
      {target ? (
        <ReportForm key={`${target.targetType}-${target.targetId}`} target={target} />
      ) : (
        <section className="report-entry-card">
          <h2>Choose what to report</h2>
          <p>Open the related listing or loan first so the report is attached to the correct record.</p>
          <div className="report-entry-actions">
            <button className="btn-primary" onClick={onBrowseItems}>Browse items</button>
            <button className="btn-secondary" onClick={onViewLoans}>View my loans</button>
          </div>
          <small>You can report a listing or its owner from item details, or report a borrowing concern from your loan history.</small>
        </section>
      )}
    </div>
  )
}

function ReportForm({ target }: { target: ReportTarget }) {
  const options = categories[target.targetType]
  const [category, setCategory] = useState(options[0][0])
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState<SubmittedReport | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await api.post<{ report: SubmittedReport }>('/reports', {
        targetType: target.targetType,
        targetId: target.targetId,
        category,
        description: description.trim(),
      })
      setSubmitted(result.report)
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to submit your report. Check your connection and try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section className="report-confirmation" role="status">
        <div className="success-icon" aria-hidden="true">✓</div>
        <h2>Report submitted</h2>
        <p>Your report has been sent to the designated review team. The details are not visible to other students.</p>
        <small>Reference: {submitted.id} · Status: {submitted.status.replace(/_/g, ' ')}</small>
      </section>
    )
  }

  return (
    <form className="form-card report-form" onSubmit={submit}>
      <div className="report-target">
        <small>REPORTING</small>
        <strong>{target.targetType === 'user' ? 'Student' : target.targetType === 'loan' ? 'Borrowing activity' : 'Listing'}: {target.label}</strong>
      </div>
      <div>
        <label htmlFor="report-category">Concern</label>
        <select
          id="report-category"
          onChange={(event) => setCategory(event.target.value)}
          value={category}
        >
          {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="report-description">Describe what happened</label>
        <textarea
          id="report-description"
          maxLength={3000}
          minLength={10}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Include relevant details, dates, and what you observed. Please do not include passwords or sensitive personal information."
          required
          rows={7}
          value={description}
        />
        <small className="field-hint">{description.length}/3000 characters (minimum 10)</small>
      </div>
      <p className="report-privacy-note">Your identity is attached securely by the server. Report details are not shown to other students.</p>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="btn-primary" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  )
}
