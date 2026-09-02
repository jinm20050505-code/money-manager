import { useEffect, useState } from 'react'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

export default function SharedView({ token }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/share?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || '共有データの取得に失敗しました')
        setData(body)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <p>読み込み中…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <div className="app shared-view">
      <header className="app-header">
        <h1>マネマネ（共有ビュー）</h1>
      </header>

      <p className="shared-note">
        {data.name}さん（{data.occupation}）の家計を閲覧しています。この画面は閲覧のみで編集はできません。
      </p>

      <section className="balance-card">
        <span className="balance-label">現在の残高</span>
        <span className={`balance-amount ${data.balance < 0 ? 'negative' : ''}`}>
          {yen.format(data.balance)}
        </span>
      </section>

      {Object.keys(data.categories).length > 0 && (
        <section className="transaction-list">
          <h2>カテゴリ別収支</h2>
          <ul className="category-summary">
            {Object.entries(data.categories).map(([category, total]) => (
              <li key={category}>
                <span>{category}</span>
                <span className={total < 0 ? 'negative' : ''}>{yen.format(total)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
