import http from 'node:http'

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection:', err)
})

const routes = [
  { pattern: '/api/transactions', handlerPath: '../api/transactions.js' },
  { pattern: '/api/fixed-payments', handlerPath: '../api/fixed-payments.js' },
  { pattern: '/api/budgets', handlerPath: '../api/budgets.js' },
  { pattern: '/api/credit-cards', handlerPath: '../api/credit-cards.js' },
  { pattern: '/api/loans', handlerPath: '../api/loans.js' },
  { pattern: '/api/share', handlerPath: '../api/share.js' },
  { pattern: '/api/profile', handlerPath: '../api/profile.js' },
  { pattern: '/api/push/subscribe', handlerPath: '../api/push/subscribe.js' },
  { pattern: '/api/savings-goal', handlerPath: '../api/savings-goal.js' },
  { pattern: '/api/cron/reminder', handlerPath: '../api/cron/reminder.js' },
]

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const search = Object.fromEntries(url.searchParams.entries())

    const route = routes.find((r) => r.pattern === url.pathname)
    if (!route) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'not found' }))
      return
    }

    let body
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const raw = Buffer.concat(chunks).toString('utf8')
      if (raw) {
        try {
          body = JSON.parse(raw)
        } catch {
          body = undefined
        }
      }
    }

    const mockReq = { method: req.method, query: search, body }
    const mockRes = {
      statusCode: 200,
      _headers: {},
      setHeader(k, v) {
        this._headers[k] = v
      },
      status(code) {
        this.statusCode = code
        return this
      },
      json(obj) {
        res.writeHead(this.statusCode, { ...this._headers, 'Content-Type': 'application/json' })
        res.end(JSON.stringify(obj))
      },
      end(text) {
        res.writeHead(this.statusCode, this._headers)
        res.end(text ?? '')
      },
    }

    const mod = await import(route.handlerPath)
    await mod.default(mockReq, mockRes)
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
  }
})

server.listen(3000, () => console.log('dev-api-server listening on :3000'))
