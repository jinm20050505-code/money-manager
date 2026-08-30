import { useState } from 'react'
import { MAX_DISPLAY_LENGTH } from '../../lib/validation.js'

export default function Truncate({ text, limit = MAX_DISPLAY_LENGTH }) {
  const [expanded, setExpanded] = useState(false)

  if (!text) return null
  if (text.length <= limit) return <>{text}</>

  if (expanded) {
    return (
      <>
        {text}{' '}
        <button type="button" className="link-button" onClick={() => setExpanded(false)}>
          閉じる
        </button>
      </>
    )
  }

  return (
    <>
      {text.slice(0, limit)}…{' '}
      <button type="button" className="link-button" onClick={() => setExpanded(true)}>
        続きを見る
      </button>
    </>
  )
}
