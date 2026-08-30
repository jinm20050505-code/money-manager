import { useState } from 'react'

const STORAGE_KEY = 'manemane-about-dismissed'

export default function AboutSection() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  if (dismissed) return null

  function handleDismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // localStorageが使えない場合は次回もう一度表示されるだけ
    }
    setDismissed(true)
  }

  return (
    <section className="about-section">
      <div className="about-section-header">
        <h2>このアプリについて</h2>
        <button type="button" className="about-dismiss" onClick={handleDismiss} aria-label="閉じる">
          ×
        </button>
      </div>
      <p>
        日払い・アルバイトで生活していると、支払日になって「お金が足りない」と気づくことがあります。
        このアプリは収入と支出を記録して残高をひと目で把握できるようにし、支払日に困る前に気づけるようにします。
      </p>
    </section>
  )
}
