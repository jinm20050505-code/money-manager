import { useState } from 'react'
import Truncate from './Truncate.jsx'
import TransactionEditRow from './TransactionEditRow.jsx'
import { useCollapsible } from '../hooks/useCollapsible.js'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

export default function TransactionList({ transactions, onDelete, onUpdated, creditCards = [] }) {
  const [open, toggle] = useCollapsible('manemane-section-transactions', true)
  const [editingId, setEditingId] = useState(null)

  const byCategory = transactions.reduce((acc, t) => {
    if (!t.category) return acc
    acc[t.category] = (acc[t.category] || 0) + (t.type === 'income' ? t.amount : -t.amount)
    return acc
  }, {})
  const categories = Object.entries(byCategory)

  return (
    <section className="transaction-list">
      <button type="button" className="section-toggle" onClick={toggle} aria-expanded={open}>
        <h2>履歴</h2>
        <span className={`section-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <>
          {categories.length > 0 && (
            <ul className="category-summary">
              {categories.map(([category, total]) => (
                <li key={category}>
                  <span>{category}</span>
                  <span className={total < 0 ? 'negative' : ''}>{yen.format(total)}</span>
                </li>
              ))}
            </ul>
          )}

          {transactions.length === 0 ? (
            <p className="empty">まだ記録がありません</p>
          ) : (
            <ul>
              {transactions.map((t) =>
                editingId === t.id ? (
                  <TransactionEditRow
                    key={t.id}
                    transaction={t}
                    creditCards={creditCards}
                    onSaved={() => {
                      setEditingId(null)
                      onUpdated?.()
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <li key={t.id} className={`transaction-item ${t.type}`}>
                    <div className="transaction-main">
                      <span className="transaction-date">
                        {new Date(t.date).toLocaleDateString('ja-JP')}
                        {t.category && (
                          <span className="transaction-category"> ・ {t.category}</span>
                        )}
                        {t.paymentMethod === 'credit' && (
                          <span className="transaction-credit-badge">クレカ</span>
                        )}
                      </span>
                      <span className="transaction-memo">
                        <Truncate text={t.memo || '（メモなし）'} />
                      </span>
                    </div>
                    <span className="transaction-amount">
                      {t.type === 'income' ? '+' : '-'}
                      {yen.format(t.amount)}
                    </span>
                    <button
                      className="edit-button"
                      onClick={() => setEditingId(t.id)}
                      aria-label="編集"
                    >
                      編集
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => onDelete(t.id)}
                      aria-label="削除"
                    >
                      ×
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
