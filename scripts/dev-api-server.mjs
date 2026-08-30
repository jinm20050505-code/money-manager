import http from 'node:http'

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection:', err)
})

const routes = [
  { pattern: /^\/api\/transactions\/?$/, handlerPath: '../api/transactions.js', params: [] },
  { pattern: /^\/api\/transactions\/([^/]+)\/?$/, handlerPath: '../api/transactions/[id].js', params: ['id'] },
  { pattern: /^\/api\/profile\/?$/, handlerPath: '../api/profile.js', params: [] },
  { pattern: /^\/api\/share\/?$/, handlerPath: '../api/share.js', params: [] },
  { pattern: /^\/api\/share\/([^/]+)\/?$/, handlerPath: '../api/share/[token].js', params: ['token'] },
  { pattern: /^\/api\/fixed-payments\/?$/, handlerPath: '../api/fixed-payments.js', params: [] },
  { pattern: /^\/api\/fixed-payments\/([^/]+)\/?$/, handlerPath: '../api/fixed-payments/[id].js', params: ['id'] },
  { pattern: /^\/api\/budgets\/?$/, handlerPath: '../api/budgets.js', params: [] },
  { pattern: /^\/api\/budgets\/([^/]+)\/?$/, handlerPath: '../api/budgets/[category].js', params: ['category'] },
  { pattern: /^\/api\/push\/subscribe\/?$/, handlerPath: '../api/push/subscribe.js', params: [] },
  { pattern: /^\/api\/cron\/reminder\/?$/, handlerPath: '../api/cron/reminder.js', params: [] },
  { pattern: /^\/api\/loans\/?$/, handlerPath: '../api/loans.js', params: [] },
  {
    pattern: /^\/api\/loans\/([^/]+)\/payments\/?$/,
    handlerPath: '../api/loans/[id]/payments.js',
    params: ['id'],
  },
  { pattern: /^\/api\/loans\/([^/]+)\/?$/, handlerPath: '../api/loans/[id].js', params: ['id'] },
  { pattern: /^\/api\/credit-cards\/?$/, handlerPath: '../api/credit-cards.js', params: [] },
  {
    pattern: /^\/api\/credit-cards\/([^/]+)\/?$/,
    handlerPath: '../api/credit-cards/[id].js',
    params: ['id'],
  },
  { pattern: /^\/api\/savings-goal\/?$/, handlerPath: '../api/savings-goal.js', params: [] },
]

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const search = Object.fromEntries(url.searchParams.entries())

    const route = routes.find((r) => r.pattern.test(url.pathname))
    if (!route) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'not found' }))
      return
    }

    const match = route.pattern.exec(url.pathname)
    const params = {}
    route.params.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1])
    })

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

    const mockReq = { method: req.method, query: { ...search, ...params }, body }
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
