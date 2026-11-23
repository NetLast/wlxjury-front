import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Island from './Island'
import { readSetup, readTexts, readTiles } from './tiles'
import './island.css'

/**
 * Mounts the gallery island on the page's #gallery[data-island], in place of unitegallery
 * (gallery-init.js leaves such a gallery alone). `?tiles=classic` keeps the old tiles, to
 * compare. The server-rendered <img> elements stay in #gallery, hidden: they are the data.
 */
export function classicRequested(search: string): boolean {
  return new URLSearchParams(search).get('tiles') === 'classic'
}

export function mount(doc: Document = document): boolean {
  const gallery = doc.querySelector('#gallery[data-island]')
  if (!gallery || classicRequested(doc.location?.search ?? '')) return false
  const host = doc.createElement('div')
  host.className = 'wlx-island'
  gallery.insertAdjacentElement('afterend', host)
  createRoot(host).render(
    <StrictMode>
      <Island
        tiles={readTiles(gallery)}
        setup={readSetup(gallery)}
        texts={readTexts(gallery, doc.querySelector('[data-csrf-token]'))}
        lang={doc.documentElement.lang || 'uk'}
      />
    </StrictMode>
  )
  return true
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mount())
else mount()
