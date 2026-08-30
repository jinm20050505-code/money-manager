import { useEffect, useState } from 'react'

export function useDraft(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage unavailable — draft simply won't persist
    }
  }, [key, value])

  function clear() {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
    setValue(initialValue)
  }

  return [value, setValue, clear]
}
