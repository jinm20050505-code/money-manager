import { useState } from 'react'
import { isBlank, REQUIRED_MESSAGE } from '../../lib/validation.js'

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next = {}
    if (isBlank(currentPassword)) next.currentPassword = REQUIRED_MESSAGE

    if (isBlank(newPassword)) next.newPassword = REQUIRED_MESSAGE
    else if (newPassword.length < 8) next.newPassword = '8文字以上で入力してください'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccess(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth?action=change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (body.errors) setErrors(body.errors)
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setErrors({})
      setSuccess('パスワードを変更しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="password-change">
      <h3>パスワード変更</h3>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          現在のパスワード
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          {errors.currentPassword && <span className="field-error">{errors.currentPassword}</span>}
        </label>

        <label>
          新しいパスワード
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
        </label>

        {success && <p className="quick-message">{success}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? '変更中…' : 'パスワードを変更する'}
        </button>
      </form>
    </div>
  )
}
