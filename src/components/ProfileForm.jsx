import { useEffect, useState } from 'react'
import { useDraft } from '../hooks/useDraft.js'
import {
  isBlank,
  hasInvalidChars,
  REQUIRED_MESSAGE,
  INVALID_CHAR_MESSAGE,
} from '../../lib/validation.js'

const emptyProfile = { name: '', age: '', occupation: '' }

export default function ProfileForm() {
  const [draft, setDraft, clearDraft] = useDraft('profile-draft', emptyProfile)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (cancelled || !profile) return
        setDraft({ name: profile.name, age: String(profile.age), occupation: profile.occupation })
        setSaved(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function validate() {
    const next = {}
    if (isBlank(draft.name)) next.name = REQUIRED_MESSAGE
    else if (hasInvalidChars(draft.name)) next.name = INVALID_CHAR_MESSAGE

    if (isBlank(draft.age)) next.age = REQUIRED_MESSAGE
    else if (!Number.isFinite(Number(draft.age)) || Number(draft.age) <= 0)
      next.age = '正しい年齢を入力してください'

    if (isBlank(draft.occupation)) next.occupation = REQUIRED_MESSAGE
    else if (hasInvalidChars(draft.occupation)) next.occupation = INVALID_CHAR_MESSAGE

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body.errors) setErrors(body.errors)
        return
      }
      clearDraft()
      setDraft(draft)
      setSaved(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="profile-form">
      <h2>プロフィール</h2>
      <form onSubmit={handleSubmit}>
        <label>
          名前
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>

        <label>
          年齢
          <input
            type="number"
            min="1"
            value={draft.age}
            onChange={(e) => setDraft({ ...draft, age: e.target.value })}
          />
          {errors.age && <span className="field-error">{errors.age}</span>}
        </label>

        <label>
          職業
          <input
            type="text"
            value={draft.occupation}
            onChange={(e) => setDraft({ ...draft, occupation: e.target.value })}
          />
          {errors.occupation && <span className="field-error">{errors.occupation}</span>}
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? '保存中…' : saved ? '更新する' : '保存する'}
        </button>
      </form>
    </section>
  )
}
