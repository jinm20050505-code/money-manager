self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }

  const title = data.title || 'マネマネ'
  const body = data.body || '今日はまだ記録がありません。気づいたときにまとめて記録できます。'

  event.waitUntil(self.registration.showNotification(title, { body }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
