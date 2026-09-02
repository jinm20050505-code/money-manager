import http from 'node:http'

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection:', err)
})

const routes = [
  { prefix: '/api/transactions', handlerPath: '../api/transactions/[[...id]].js', paramName: 'id' },
  { prefix: '/api/fixed-payments', handlerPath: '../api/fixed-payments/[[...id]].js', paramName: 'id' },
  { prefix: '/api/budgets', handlerPath: '../api/budgets/[[...category]].js', paramName: 'category' },
  { prefix: '/api/credit-cards', handlerPath: '../api/credit-cards/[[...id]].js', paramName: 'id' },
  { prefix: '/api/loans', handlerPath: '../api/loans/[[...segments]].js', paramName: 'segments' },
  { prefix: '/api/share', handlerPath: '../api/share/[[...token]].js', paramName: 'token' },
  { prefix: '/api/profile', handlerPath: '../api/profile.js', paramName: null },
  { prefix: '/api/push/subscribe', handlerPath: '../api/push/subscribe.js', paramName: null },
  { prefix: '/api/savings-goal', handlerPath: '../api/savings-goal.js', paramName: null },
  { prefix: '/api/cron/reminder', handlerPath: '../api/cron/reminder.js', paramName: null },
]

function matchRoute(pathname) {
  for (const route of routes) {
    if (pathname === route.prefix) return { route, rest: '' }
    if (pathname.startsWith(`${route.prefix}/`)) {
      return { route, rest: pathname.slice(route.prefix.length + 1) }
    }
  }
  return null
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const search = Object.fromEntries(url.searchParams.entries())

    const matched = matchRoute(url.pathname)
    if (!matched) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'not found' }))
      return
    }

    const { route, rest } = matched
    const params = {}
    if (route.paramName) {
      const segments = rest.split('/').filter(Boolean).map(decodeURIComponent)
      if (segments.length > 0) params[route.paramName] = segments
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
