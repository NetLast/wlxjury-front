import { USE_MOCK } from './baseQuery'

/** What the screener / admin needs without leaving for Commons. */
export interface CommonsInfo {
  description?: string
  year?: string
  camera?: string
  license?: string
}

export interface CommonsThumb {
  title: string
  thumbUrl: string
  pageUrl: string
}

const API = 'https://commons.wikimedia.org/w/api.php'

const plain = (html?: string): string | undefined => {
  if (!html) return undefined
  // Commons descriptions are HTML: show the text only, never inject the markup
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim()
  return text || undefined
}

async function query(params: Record<string, string>, signal?: AbortSignal) {
  const url = `${API}?${new URLSearchParams({ action: 'query', format: 'json', origin: '*', ...params })}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Commons: HTTP ${res.status}`)
  return res.json()
}

/** Extra data of one file: photo year, description, camera model, licence. */
export async function fetchCommonsInfo(title: string, signal?: AbortSignal): Promise<CommonsInfo> {
  if (USE_MOCK) {
    return { description: `Опис фото ${title.replace(/^File:/, '')}`, year: '2023', camera: 'Canon EOS 80D', license: 'CC BY-SA 4.0' }
  }
  const json = await query({ prop: 'imageinfo', iiprop: 'extmetadata|metadata', titles: title }, signal)
  const page = Object.values(json.query?.pages ?? {})[0] as
    | { imageinfo?: { extmetadata?: Record<string, { value: string }>; metadata?: { name: string; value: unknown }[] }[] }
    | undefined
  const info = page?.imageinfo?.[0]
  const meta = info?.extmetadata ?? {}
  const exif = (name: string) => info?.metadata?.find((m) => m.name === name)?.value
  const date = String(meta.DateTimeOriginal?.value ?? exif('DateTimeOriginal') ?? '')
  return {
    description: plain(meta.ImageDescription?.value),
    year: /\b(19|20)\d{2}\b/.exec(date)?.[0],
    camera: [exif('Make'), exif('Model')].filter((v) => typeof v === 'string' && v).join(' ') || plain(meta.Model?.value),
    license: plain(meta.LicenseShortName?.value)
  }
}

/** The first files of a Commons category, as thumbnails (the preview of a new campaign). */
export async function fetchCategoryThumbs(category: string, limit = 12, signal?: AbortSignal): Promise<CommonsThumb[]> {
  const name = category.replace(/^Category:/i, '').trim()
  if (!name) return []
  if (USE_MOCK) {
    return Array.from({ length: Math.min(limit, 8) }, (_, i) => ({
      title: `File:${name} ${i + 1}.jpg`,
      thumbUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="100%" height="100%" fill="hsl(${i * 45},50%,40%)"/></svg>`)}`,
      pageUrl: 'https://commons.wikimedia.org/'
    }))
  }
  const json = await query({
    generator: 'categorymembers', gcmtitle: `Category:${name}`, gcmtype: 'file', gcmlimit: String(limit),
    prop: 'imageinfo', iiprop: 'url', iiurlwidth: '240'
  }, signal)
  const pages = Object.values(json.query?.pages ?? {}) as { title: string; imageinfo?: { thumburl?: string; descriptionurl?: string }[] }[]
  return pages
    .filter((p) => p.imageinfo?.[0]?.thumburl)
    .map((p) => ({ title: p.title, thumbUrl: p.imageinfo![0].thumburl!, pageUrl: p.imageinfo![0].descriptionurl ?? '' }))
}
