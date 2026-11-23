import { descriptionText } from './wikitext'
import { commonsUrl, type Texts, type Tile } from './tiles'

/**
 * What the enlarged photo says about the file: its title, size, and what this viewer may see.
 * The page decides that: the description and the author come only to those the server shows
 * them to (organizers, admins, root); a juror sees the monument, which names no person.
 */
export default function Caption({ tile, texts, lang }: { tile: Tile; texts: Texts; lang: string }) {
  const description = tile.description ? descriptionText(tile.description, lang) : ''
  const meta = [
    tile.author && `${texts.author}: ${tile.author}`,
    tile.monumentId && texts.monument.replace('{0}', tile.monumentId),
    tile.width > 0 && `${tile.width} × ${tile.height}`
  ].filter(Boolean).join(' · ')
  return (
    <div className="wlx-island-caption">
      <div className="wlx-island-title">{tile.title.replace(/^File:/, '')}</div>
      {description && <div className="wlx-island-desc">{description}</div>}
      {meta && <div className="wlx-island-meta">{meta}</div>}
      <div className="wlx-island-links">
        {tile.largeUrl && <a href={tile.largeUrl}><i className="bi bi-info-circle" aria-hidden="true" /> {texts.fileInfo}</a>}
        <a href={commonsUrl(tile.title)} target="_blank" rel="noopener noreferrer"><i className="bi bi-box-arrow-up-right" aria-hidden="true" /> {texts.commons}</a>
      </div>
    </div>
  )
}
