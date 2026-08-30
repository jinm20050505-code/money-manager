const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

function monthKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function MonthlyChart({ transactions }) {
  const now = new Date()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: monthKey(d), label: `${d.getMonth() + 1}月` })
  }

  const totals = Object.fromEntries(months.map((m) => [m.key, { income: 0, expense: 0 }]))
  transactions.forEach((t) => {
    const key = monthKey(t.date)
    if (totals[key]) totals[key][t.type] += t.amount
  })

  const chartHeight = 120
  const maxValue = Math.max(1, ...months.flatMap((m) => [totals[m.key].income, totals[m.key].expense]))

  return (
    <section className="monthly-chart">
      <h2>月ごとの収支</h2>
      <svg
        viewBox={`0 0 ${months.length * 60} ${chartHeight + 20}`}
        className="chart-svg"
        role="img"
        aria-label="月ごとの収入と支出"
      >
        {months.map((m, i) => {
          const income = totals[m.key].income
          const expense = totals[m.key].expense
          const incomeHeight = (income / maxValue) * chartHeight
          const expenseHeight = (expense / maxValue) * chartHeight
          const x = i * 60
          return (
            <g key={m.key}>
              <title>
                {m.label}：収入 {yen.format(income)} / 支出 {yen.format(expense)}
              </title>
              <rect x={x + 8} y={chartHeight - incomeHeight} width="16" height={incomeHeight} fill="#2f9e44" />
              <rect x={x + 30} y={chartHeight - expenseHeight} width="16" height={expenseHeight} fill="#e03131" />
              <text x={x + 30} y={chartHeight + 15} fontSize="10" textAnchor="middle" fill="#555">
                {m.label}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="chart-legend">
        <span>
          <i className="legend-dot income" />
          収入
        </span>
        <span>
          <i className="legend-dot expense" />
          支出
        </span>
      </div>
    </section>
  )
}
