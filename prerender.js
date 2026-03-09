import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

const template = fs.readFileSync(toAbsolute('dist/index.html'), 'utf-8')
const { render } = await import('./dist/server/entry-server.js')

// Only prerender the landing page
const routesToPrerender = ['/']

;(async () => {
  for (const routeUrl of routesToPrerender) {
    const appHtml = render(routeUrl)
    const html = template.replace('<!--app-html-->', appHtml)

    const filePath = `dist${routeUrl === '/' ? '/index' : routeUrl}.html`
    fs.writeFileSync(toAbsolute(filePath), html)
    console.log('pre-rendered:', filePath)
  }
})()
