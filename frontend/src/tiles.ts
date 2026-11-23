/**
 * What the island shows, read from the page as the server rendered it (gallery.scala.html):
 * #gallery's attributes (views.GalleryTiles) and one <img> per file with its data-* attributes.
 * Nothing here talks to the server: the page already decided who sees what (authors and
 * descriptions only for those who may see the round's organizer views, secure-coding §22).
 */

export interface Stars {
  /** stars shown */
  number: number
  /** half stars: a rate is two units per star (a 1-10 round shown as 5 stars) */
  half: boolean
  /** the round takes the worst mark (✗, rate -1) beside the stars */
  worst: boolean
}

export interface GallerySetup {
  /** the viewer votes on these tiles (their own files in an active round) */
  jury: boolean
  binary: boolean
  stars: Stars | null
  /** one juror's votes shown read-only (binary rounds) */
  viewVotes: boolean
}

export interface Tile {
  pageId: string
  roundId: string
  title: string
  src: string
  /** the large view's picture (data-image), for the enlarged photo */
  large: string
  srcSet: { src: string; width: number; height: number }[]
  width: number
  height: number
  rate: number
  largeUrl: string
  monumentId: string | null
  /** only present when the server shows authors to this viewer */
  author: string | null
  /** only present when the server shows descriptions to this viewer; may be wikitext */
  description: string | null
  approvals: number | null
  rejections: number | null
  tally: string | null
  comments: number
  commentsLabel: string | null
}

/** The page's texts (voteTexts.scala.html and #gallery's data-label-*): no literal UI text in the island. */
export interface Texts {
  selected: string
  rejected: string
  worst: string
  clear: string
  author: string
  /** "Monument: {0}" */
  monument: string
  close: string
  previous: string
  next: string
  /** the link to the large view page (comments, criteria, keyboard) */
  fileInfo: string
  commons: string
}

function json<T>(el: Element, name: string): T | null {
  const raw = el.getAttribute(name)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function readSetup(gallery: Element): GallerySetup {
  const stars = json<Partial<Stars>>(gallery, 'data-stars')
  return {
    jury: gallery.getAttribute('data-jury') === 'true',
    binary: gallery.getAttribute('data-binary') === 'true',
    stars: stars && typeof stars.number === 'number'
      ? { number: stars.number, half: !!stars.half, worst: !!stars.worst }
      : null,
    viewVotes: json(gallery, 'data-view-votes') !== null
  }
}

export function readTexts(gallery: Element, holder: Element | null): Texts {
  const from = (el: Element | null, name: string) => el?.getAttribute(name) ?? ''
  return {
    selected: from(holder, 'data-vote-selected'),
    rejected: from(holder, 'data-vote-rejected'),
    worst: from(holder, 'data-vote-worst'),
    clear: from(holder, 'data-vote-clear'),
    author: from(gallery, 'data-label-author'),
    monument: from(gallery, 'data-label-monument') || '{0}',
    close: from(gallery, 'data-label-close'),
    previous: from(gallery, 'data-label-previous'),
    next: from(gallery, 'data-label-next'),
    fileInfo: from(gallery, 'data-label-file-info'),
    commons: from(gallery, 'data-label-commons')
  }
}

const PX = /\/(\d+)px-[^/]+$/

/**
 * The thumbnails the page offers (src and the 1.5x / 2x srcset), as width-described sources, so
 * that the album picks the smallest one that is sharp enough for each tile's size. A Commons
 * thumbnail's width is in its name ("…/320px-File.jpg"); a source without one (the original
 * file) is the file's full width.
 */
export function sourcesOf(img: Element, width: number, height: number): Tile['srcSet'] {
  const urls = [img.getAttribute('src') ?? '']
  for (const part of (img.getAttribute('srcset') ?? '').split(',')) {
    const url = part.trim().split(/\s+/)[0]
    if (url) urls.push(url)
  }
  const seen = new Map<number, string>()
  for (const url of urls) {
    if (!url) continue
    const m = PX.exec(url)
    const w = m ? Number(m[1]) : width
    if (w > 0 && !seen.has(w)) seen.set(w, url)
  }
  return [...seen.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([w, src]) => ({ src, width: w, height: width > 0 ? Math.round((height * w) / width) : 0 }))
}

const num = (v: string | null): number | null => (v === null || v === '' || isNaN(Number(v)) ? null : Number(v))

/** The file's title as text: data-description is "<b>title</b>", the alt a link; neither is used as HTML. */
function titleOf(img: Element): string {
  const fromDesc = img.getAttribute('data-description') ?? ''
  const text = new DOMParser().parseFromString(fromDesc, 'text/html').body.textContent?.trim()
  return text || img.getAttribute('data-title') || ''
}

export function readTiles(gallery: Element): Tile[] {
  return [...gallery.querySelectorAll('img[data-pageId], img[data-pageid]')].map((img) => {
    const width = Number(img.getAttribute('data-width')) || 0
    const height = Number(img.getAttribute('data-height')) || 0
    return {
      pageId: img.getAttribute('data-pageId') ?? img.getAttribute('data-pageid') ?? '',
      roundId: img.getAttribute('data-roundId') ?? img.getAttribute('data-roundid') ?? '',
      title: titleOf(img),
      src: img.getAttribute('src') ?? '',
      large: img.getAttribute('data-image') || img.getAttribute('src') || '',
      srcSet: sourcesOf(img, width, height),
      width,
      height,
      rate: Number(img.getAttribute('data-rate')) || 0,
      largeUrl: img.getAttribute('data-largeUrl') ?? img.getAttribute('data-largeurl') ?? '',
      monumentId: img.getAttribute('data-monument-id') || null,
      author: img.getAttribute('data-author') || null,
      description: img.getAttribute('data-desc') || null,
      approvals: num(img.getAttribute('data-approvals')),
      rejections: num(img.getAttribute('data-rejections')),
      tally: img.getAttribute('data-tally'),
      comments: Number(img.getAttribute('data-comments')) || 0,
      commentsLabel: img.getAttribute('data-comments-label')
    }
  })
}

/** The file's page on Commons. */
export const commonsUrl = (title: string): string =>
  `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%3A/gi, ':')}`
