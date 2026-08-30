import { useState } from 'react'

export function useCollapsible(key, defaultOpen) {
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved === null ? defaultOpen : saved === 'true'
    } catch {
      return defaultOpen
    }
  })

  function toggle() {
    setOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(key, String(next))
      } catch {
        // localStorageが使えない場合は開閉状態を記憶しないだけ
      }
      return next
    })
  }

  return [open, toggle]
}
