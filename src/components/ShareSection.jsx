import { useState } from 'react'

export default function ShareSection() {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  async function handleShare() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/share', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || '共有リンクの発行に失敗しました')
      setUrl(`${window.location.origin}/?share=${body.token}`)
      setCopied(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // clipboard unavailable — user can still select and copy the link manually
    }
  }

  return (
    <section className="share-section">
      <h2>誰かと共有する</h2>
      <p className="share-hint">
        彼女・友人・家族に見てもらえる、残高とカテゴリ別収支のみが見える閲覧用リンクを発行できます。
      </p>

      {!url ? (
        <button type="button" onClick={handleShare} disabled={loading}>
          {loading ? '発行中…' : '共有リンクを発行する'}
        </button>
      ) : (
        <div className="share-url-row">
          <input type="text" readOnly value={url} onFocus={(e) => e.target.select()} />
          <button type="button" onClick={handleCopy}>
            {copied ? 'コピーしました' : 'コピー'}
          </button>
        </div>
      )}

      {error && <p className="field-error">{error}</p>}
    </section>
  )
}
