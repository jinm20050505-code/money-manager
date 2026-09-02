import { useState } from 'react'
import {
  isBlank,
  hasInvalidChars,
  REQUIRED_MESSAGE,
  INVALID_CHAR_MESSAGE,
} from '../../lib/validation.js'

export default function ProfileSetupScreen({ onCompleted }) {
  const [form, setForm] = useState({ name: '', age: '', occupation: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next = {}
    if (isBlank(form.name)) next.name = REQUIRED_MESSAGE
    else if (hasInvalidChars(form.name)) next.name = INVALID_CHAR_MESSAGE

    if (isBlank(form.age)) next.age = REQUIRED_MESSAGE
    else if (!Number.isFinite(Number(form.age)) || Number(form.age) <= 0)
      next.age = '正しい年齢を入力してください'

    if (isBlank(form.occupation)) next.occupation = REQUIRED_MESSAGE
    else if (hasInvalidChars(form.occupation)) next.occupation = INVALID_CHAR_MESSAGE

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
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body.errors) setErrors(body.errors)
        return
      }
      onCompleted(await res.json())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>マネマネ</h1>
        <p className="app-subtitle">Money Manager</p>
      </header>

      <section className="auth-card">
        <h2>はじめに、プロフィールを教えてください</h2>
        <p className="share-hint">あとから「設定」タブでいつでも変更できます。</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            名前
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>

          <label>
            年齢
            <input
              type="number"
              min="1"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
            {errors.age && <span className="field-error">{errors.age}</span>}
          </label>

          <label>
            職業
            <input
              type="text"
              value={form.occupation}
              onChange={(e) => setForm({ ...form, occupation: e.target.value })}
            />
            {errors.occupation && <span className="field-error">{errors.occupation}</span>}
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? '保存中…' : 'はじめる'}
          </button>
        </form>
      </section>
    </div>
  )
}
