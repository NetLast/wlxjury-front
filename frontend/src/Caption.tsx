import { descriptionText } from './wikitext'
import type { Texts, Tile } from './tiles'

/**
 * The card's description, at the top of the tile: the file's title, and what this viewer may
 * see about it. The page decides that: the description and the author come only to those the
 * server shows them to (organizers, admins, root); a juror sees the monument instead, which
 * names no person. Two lines at rest, the whole text while the tile is pointed at or focused.
 */
export default function Caption({ tile, texts, lang }: { tile: Tile; texts: Texts; lang: string }) {
  const description = tile.description ? descriptionText(tile.description, lang) : ''
  const meta = [
    tile.author && `${texts.author}: ${tile.author}`,
    tile.monumentId && texts.monument.replace('{0}', tile.monumentId)
  ].filter(Boolean).join(' · ')
  const title = tile.title.replace(/^File:/, '').replace(/\.[a-z0-9]{3,4}$/i, '')
  return (
    <div className="wlx-island-caption">
      <div className="wlx-island-title">{title}</div>
      {description && <div className="wlx-island-desc">{description}</div>}
      {meta && <div className="wlx-island-meta">{meta}</div>}
    </div>
  )
}
