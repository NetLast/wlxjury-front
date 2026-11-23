import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * The island is built as one classic script and one stylesheet into public/gallery-island/,
 * which Play serves (routes.Assets.versioned) like any file under public/. Only that folder is
 * written: never empty public/ (emptyOutDir false, outDir the island's own folder).
 */

/** The demo page's stand-in for GalleryController.selectWS: every vote succeeds, rate 7 is 409. */
function fakeVotes(): Plugin {
  return {
    name: 'fake-votes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /^\/rate\/round\/\d+\/pageid\/\d+\/select\/(-?\d+)/.exec(req.url ?? '')
        if (!m || req.method !== 'POST') return next()
        if (m[1] === '7') {
          res.statusCode = 409
          res.setHeader('Content-Type', 'application/json')
          res.end('{"error":"round_closed"}')
        } else {
          res.end('success')
        }
      })
    }
  }
}

/** The demo page's stand-ins for the app: its public/ files, and Commons-style thumbnails. */
function demoAssets(): Plugin {
  return {
    name: 'demo-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        const pub = /^\/app-public\/((?:javascripts|stylesheets)\/[\w.-]+\.(?:js|css))$/.exec(url)
        if (pub) {
          res.setHeader('Content-Type', pub[1].endsWith('.css') ? 'text/css' : 'text/javascript')
          res.end(readFileSync(resolve(import.meta.dirname, '../public', pub[1])))
          return
        }
        const t = /^\/thumbs\/(\d+)x(\d+)\/(\d+)px-Photo_(\d+)\.jpg$/.exec(url)
        if (!t) return next()
        const [w, h, px, n] = t.slice(1).map(Number)
        const ph = Math.round((h * px) / w)
        const hue = (n * 47) % 360
        res.setHeader('Content-Type', 'image/svg+xml')
        res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${ph}"><defs><linearGradient id="g" x2="1" y2="1">` +
          `<stop offset="0" stop-color="hsl(${hue},55%,45%)"/><stop offset="1" stop-color="#101820"/></linearGradient></defs>` +
          `<rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="60%" fill="#fff" fill-opacity=".8" font-family="sans-serif" ` +
          `font-size="${Math.round(px / 10)}" text-anchor="middle">#${n} · ${px}px</text></svg>`)
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), fakeVotes(), demoAssets()],
  define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production') },
  build: {
    outDir: '../public/gallery-island',
    emptyOutDir: true,
    target: ['chrome109', 'firefox115', 'safari16', 'edge109'],
    lib: {
      entry: 'src/main.tsx',
      name: 'WlxGalleryIsland',
      formats: ['iife'],
      fileName: () => 'gallery-island.js',
      cssFileName: 'gallery-island'
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts']
  }
})
