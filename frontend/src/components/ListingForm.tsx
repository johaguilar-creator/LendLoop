import { useState, type FormEvent } from 'react'
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

const conditions = [
  ['new', 'New'],
  ['like_new', 'Like new'],
  ['good', 'Good'],
  ['fair', 'Fair'],
] as const

type ListingFormProps = {
  item?: LendingItem
  onCancel: () => void
  onSaved: (item: LendingItem) => void
}

export default function ListingForm({ item, onCancel, onSaved }: ListingFormProps) {
  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [category, setCategory] = useState(item?.category ?? 'electronics')
  const [condition, setCondition] = useState(item?.condition ?? 'good')
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? '')
  const [available, setAvailable] = useState(item?.available ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      condition,
      imageUrl: imageUrl.trim(),
      ...(item ? { available } : {}),
    }

    try {
      const result = item
        ? await api.patch<{ item: LendingItem }>(`/items/${item._id}`, payload)
        : await api.post<{ item: LendingItem }>('/items', payload)
      onSaved(result.item)
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to save this listing. Check your connection and try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <div className="kicker">LENDLOOP</div>
          <h1>{item ? 'Edit listing' : 'List an item'}</h1>
          <p>{item ? 'Keep your listing details and availability up to date.' : 'Share something useful with the ADNU community.'}</p>
        </div>
      </div>
      <form className="listing-form" onSubmit={submit}>
        <div className="listing-form-grid">
          <section className="form-card listing-fields">
            <div>
              <label htmlFor="listing-title">Item name</label>
              <input
                autoComplete="off"
                id="listing-title"
                maxLength={120}
                minLength={3}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Scientific calculator"
                required
                value={title}
              />
            </div>
            <div>
              <label htmlFor="listing-description">Description</label>
              <textarea
                id="listing-description"
                maxLength={3000}
                minLength={10}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the item's condition, what is included, and any pickup details."
                required
                rows={6}
                value={description}
              />
              <small className="field-hint">{description.length}/3000 characters (minimum 10)</small>
            </div>
            <div className="listing-field-row">
              <div>
                <label htmlFor="listing-category">Category</label>
                <select id="listing-category" onChange={(event) => setCategory(event.target.value)} value={category}>
                  {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="listing-condition">Condition</label>
                <select id="listing-condition" onChange={(event) => setCondition(event.target.value)} value={condition}>
                  {conditions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="listing-image">Image URL (optional)</label>
              <input
                id="listing-image"
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/item-photo.jpg"
                type="url"
                value={imageUrl}
              />
              <small className="field-hint">Only HTTPS image links are accepted. File uploads are not configured.</small>
            </div>
            {item && (
              <label className="availability-toggle">
                <input checked={available} onChange={(event) => setAvailable(event.target.checked)} type="checkbox" />
                <span>Available to borrow</span>
              </label>
            )}
            {error && <div className="form-error" role="alert">{error}</div>}
            <div className="listing-actions">
              <button className="btn-secondary" onClick={onCancel} type="button">Cancel</button>
              <button className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : item ? 'Save changes' : 'Publish listing'}
              </button>
            </div>
          </section>
          <aside className="listing-preview">
            <h2>Preview</h2>
            <div className="item-card">
              <div className="image-wrap">
                {imageUrl ? <img src={imageUrl} alt="" /> : <div className="item-image-placeholder">Photo placeholder</div>}
              </div>
              <div className="item-body">
                <div className="eyebrow">{category.replace(/_/g, ' ')} · {condition.replace(/_/g, ' ')}</div>
                <div className="item-title">{title || 'Your item name'}</div>
                <p className="listing-preview-description">{description || 'Your item description will appear here.'}</p>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
