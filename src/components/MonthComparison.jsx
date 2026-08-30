const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

function monthKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${d.getMonth()}`
}

function diffLabel(diff) {
  if (diff === 0) return '±¥0'
  const sign = diff > 0 ? '+' : '-'
  return `${sign}${yen.format(Math.abs(diff))}`
}

export default function MonthComparison({ transactions }) {
  const now = new Date()
  const thisKey = monthKey(now)
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastKey = monthKey(lastMonthDate)

  const totals = {
    [thisKey]: { income: 0, expense: 0, categories: {} },
    [lastKey]: { income: 0, expense: 0, categories: {} },
  }

  transactions.forEach((t) => {
    const key = monthKey(t.date)
    if (!totals[key]) return
    totals[key][t.type] += t.amount
    if (t.type === 'expense' && t.category) {
      totals[key].categories[t.category] = (totals[key].categories[t.category] || 0) + t.amount
    }
  })

  const thisMonth = totals[thisKey]
  const lastMonth = totals[lastKey]
  const categories = Array.from(
    new Set([...Object.keys(thisMonth.categories), ...Object.keys(lastMonth.categories)]),
  )

  const expenseDiff = thisMonth.expense - lastMonth.expense
  const incomeDiff = thisMonth.income - lastMonth.income

  return (
    <section className="month-comparison">
      <h2>先月との比較</h2>

      <div className="comparison-row">
        <span className="comparison-label">支出</span>
        <span className="comparison-value">{yen.format(thisMonth.expense)}</span>
        <span className={expenseDiff > 0 ? 'comparison-diff negative' : 'comparison-diff positive'}>
          {diffLabel(expenseDiff)}
        </span>
      </div>

      <div className="comparison-row">
        <span className="comparison-label">収入</span>
        <span className="comparison-value">{yen.format(thisMonth.income)}</span>
        <span className={incomeDiff < 0 ? 'comparison-diff negative' : 'comparison-diff positive'}>
          {diffLabel(incomeDiff)}
        </span>
      </div>

      {categories.length > 0 && (
        <ul className="comparison-categories">
          {categories.map((c) => {
            const cur = thisMonth.categories[c] || 0
            const prev = lastMonth.categories[c] || 0
            const diff = cur - prev
            return (
              <li key={c}>
                <span className="comparison-label">{c}</span>
                <span className="comparison-value">{yen.format(cur)}</span>
                <span className={diff > 0 ? 'comparison-diff negative' : 'comparison-diff positive'}>
                  {diffLabel(diff)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
