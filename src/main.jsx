import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

const originalFetch = window.fetch
window.fetch = async (...args) => {
  const response = await originalFetch(...args)
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url
  if (response.status === 401 && url?.startsWith('/api/') && !url.startsWith('/api/auth')) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }
  return response
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // 通知非対応ブラウザなどでの登録失敗はPWAとしての利用をブロックしない
  })
}
