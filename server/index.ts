import http from 'node:http'
import { renderRoute } from './router'
import { FAVICON_BUFFER } from './assets'

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')

  if (url.pathname === '/favicon.ico') {
    res.writeHead(200, { 'Content-Type': 'image/x-icon' })
    res.end(FAVICON_BUFFER)
    return
  }

  try {
    const { status, html } = await renderRoute(url.pathname)
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  } catch (err) {
    console.error(err)
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Internal Server Error')
  }
})

server.listen(PORT, () => {
  console.log(`llm-wiki listening on http://localhost:${PORT}`)
})
