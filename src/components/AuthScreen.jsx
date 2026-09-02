import { useState } from 'react'
import { isBlank, REQUIRED_MESSAGE } from '../../lib/validation.js'

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next = {}
    if (isBlank(email)) next.email = REQUIRED_MESSAGE
    if (isBlank(password)) next.password = REQUIRED_MESSAGE
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/auth?action=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (body.errors) setErrors(body.errors)
        else setError(body.error || '失敗しました')
        return
      }
      onAuthenticated(body)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>マネマネ</h1>
        <p className="app-subtitle">Money Manager</p>
        <p className="app-tagline">毎月のお金を管理</p>
      </header>

      <section className="auth-card">
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login')
              setErrors({})
              setError(null)
            }}
          >
            ログイン
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register')
              setErrors({})
              setError(null)
            }}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>

          <label>
            パスワード
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
            {mode === 'register' && <span className="auth-hint">8文字以上で入力してください</span>}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            ログイン状態を維持する
          </label>

          {error && <p className="field-error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? '処理中…' : mode === 'login' ? 'ログイン' : '登録する'}
          </button>
        </form>
      </section>
    </div>
  )
}
