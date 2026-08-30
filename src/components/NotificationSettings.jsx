import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export default function NotificationSettings() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription()
      if (sub) setStatus('subscribed')
    })
  }, [])

  async function handleEnable() {
    setError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const reg = await navigator.serviceWorker.register('/sw.js')
      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) throw new Error('通知の登録に失敗しました')

      setStatus('subscribed')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <section className="notification-section">
      <h2>毎日のリマインダー通知</h2>
      <p className="share-hint">
        毎日21:00（日本時間）に、その日まだ記録がなければ通知でお知らせします。1日抜けても大丈夫、気づいたときにまとめて記録すればOKです。
      </p>

      {status === 'unsupported' && (
        <p className="field-error">このブラウザは通知に対応していません</p>
      )}
      {status === 'denied' && (
        <p className="field-error">通知が許可されませんでした。ブラウザの設定を確認してください</p>
      )}
      {status === 'subscribed' ? (
        <p className="shared-note">通知は有効になっています</p>
      ) : status !== 'unsupported' ? (
        <button type="button" onClick={handleEnable}>
          通知を有効にする
        </button>
      ) : null}

      {error && <p className="field-error">{error}</p>}
    </section>
  )
}
