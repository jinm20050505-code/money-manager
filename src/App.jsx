import { useEffect, useState } from 'react'
import AboutSection from './components/AboutSection.jsx'
import BudgetSection from './components/BudgetSection.jsx'
import CalendarView from './components/CalendarView.jsx'
import CreditCardSection from './components/CreditCardSection.jsx'
import DailyAllowance from './components/DailyAllowance.jsx'
import FixedPaymentSection from './components/FixedPaymentSection.jsx'
import LoanSection from './components/LoanSection.jsx'
import MonthComparison from './components/MonthComparison.jsx'
import MonthlyChart from './components/MonthlyChart.jsx'
import NotificationSettings from './components/NotificationSettings.jsx'
import PaymentAlert from './components/PaymentAlert.jsx'
import ProfileForm from './components/ProfileForm.jsx'
import SavingsGoalSection from './components/SavingsGoalSection.jsx'
import ShareSection from './components/ShareSection.jsx'
import SharedView from './components/SharedView.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import TransactionList from './components/TransactionList.jsx'
import { calculateBalance, creditCardFixedPayments } from './lib/creditCard.js'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

const TABS = [
  { key: 'home', label: 'ホーム' },
  { key: 'history', label: '履歴' },
  { key: 'fixed', label: '固定費・借入' },
  { key: 'settings', label: '設定' },
]

export default function App() {
  const shareToken = new URLSearchParams(window.location.search).get('share')

  const [tab, setTab] = useState('home')
  const [transactions, setTransactions] = useState([])
  const [fixedPayments, setFixedPayments] = useState([])
  const [loans, setLoans] = useState([])
  const [creditCards, setCreditCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (shareToken) return
    loadTransactions()
    loadFixedPayments()
    loadLoans()
    loadCreditCards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadTransactions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/transactions')
      if (!res.ok) throw new Error('取引の取得に失敗しました')
      setTransactions(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadFixedPayments() {
    try {
      const res = await fetch('/api/fixed-payments')
      if (res.ok) setFixedPayments(await res.json())
    } catch {
      // 固定費の取得失敗は残高表示をブロックしない
    }
  }

  async function loadLoans() {
    try {
      const res = await fetch('/api/loans')
      if (res.ok) setLoans(await res.json())
    } catch {
      // 借入記録の取得失敗は他の表示をブロックしない
    }
  }

  async function loadCreditCards() {
    try {
      const res = await fetch('/api/credit-cards')
      if (res.ok) setCreditCards(await res.json())
    } catch {
      // カード情報の取得失敗は他の表示をブロックしない
    }
  }

  async function handleDelete(id) {
    setError(null)
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('削除に失敗しました')
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  if (shareToken) {
    return <SharedView token={shareToken} />
  }

  const balance = calculateBalance(transactions, creditCards)
  const alertPayments = [...fixedPayments, ...creditCardFixedPayments(creditCards, transactions)]

  return (
    <div className="app">
      <header className="app-header">
        <h1>マネマネ</h1>
        <p className="app-subtitle">Money Manager</p>
        <p className="app-tagline">毎月のお金を管理</p>
      </header>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab-button ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && <p className="error">{error}</p>}

      {tab === 'home' && (
        <>
          <AboutSection />

          <PaymentAlert balance={balance} fixedPayments={alertPayments} />

          <section className="balance-card">
            <span className="balance-label">現在の残高</span>
            <span className={`balance-amount ${balance < 0 ? 'negative' : ''}`}>
              {yen.format(balance)}
            </span>
          </section>

          <DailyAllowance balance={balance} fixedPayments={alertPayments} loans={loans} />

          <TransactionForm onCreated={loadTransactions} creditCards={creditCards} />
        </>
      )}

      {tab === 'history' &&
        (loading ? (
          <p>読み込み中…</p>
        ) : (
          <>
            <CalendarView transactions={transactions} fixedPayments={alertPayments} />
            <TransactionList
              transactions={transactions}
              onDelete={handleDelete}
              onUpdated={loadTransactions}
              creditCards={creditCards}
            />
            <MonthlyChart transactions={transactions} />
            <MonthComparison transactions={transactions} />
            <SavingsGoalSection transactions={transactions} />
            <BudgetSection transactions={transactions} />
          </>
        ))}

      {tab === 'fixed' && (
        <>
          <FixedPaymentSection payments={fixedPayments} onChanged={loadFixedPayments} />
          <CreditCardSection cards={creditCards} transactions={transactions} onChanged={loadCreditCards} />
          <LoanSection loans={loans} onChanged={loadLoans} />
        </>
      )}

      {tab === 'settings' && (
        <>
          <ProfileForm />
          <NotificationSettings />
          <ShareSection />
        </>
      )}
    </div>
  )
}
