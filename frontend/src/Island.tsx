import { useCallback, useRef, useState } from 'react'
import { RowsPhotoAlbum, type Photo } from 'react-photo-album'
import 'react-photo-album/rows.css'
import Caption from './Caption'
import TileImage from './TileImage'
import VoteBar from './VoteBar'
import { sendVote } from './votes'
import type { GallerySetup, Texts, Tile } from './tiles'

type TilePhoto = Photo & { tile: Tile }

interface Props {
  tiles: Tile[]
  setup: GallerySetup
  texts: Texts
  lang: string
  /** the old gallery's row height (gallery-init.js tiles_justified_row_height) */
  rowHeight?: number
}

/** The mark of a vote shown read-only (another juror's, or a closed round's), as tile-votes.js's chip. */
function markOf(setup: GallerySetup, rate: number): string | null {
  if (rate === 0) return null
  if (rate < 0) return '✗'
  if (setup.binary) return '✓'
  const units = setup.stars?.half ? 2 : 1
  return `${rate / units}★`
}

export default function Island({ tiles, setup, texts, lang, rowHeight = 200 }: Props) {
  const [rates, setRates] = useState<Record<string, number>>(() => Object.fromEntries(tiles.map((t) => [t.pageId, t.rate])))
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const pending = useRef(new Set<string>())

  const rate = useCallback(async (tile: Tile, value: number) => {
    // one vote at a time per file, so they are stored in the order shown (tile-votes.js)
    if (pending.current.has(tile.pageId)) return
    pending.current.add(tile.pageId)
    const before = rates[tile.pageId] ?? 0
    setRates((r) => ({ ...r, [tile.pageId]: value }))
    setBusy((b) => ({ ...b, [tile.pageId]: true }))
    try {
      await sendVote(tile.roundId, tile.pageId, value)
    } catch {
      setRates((r) => ({ ...r, [tile.pageId]: before }))
    } finally {
      pending.current.delete(tile.pageId)
      setBusy((b) => ({ ...b, [tile.pageId]: false }))
    }
  }, [rates])

  const photos: TilePhoto[] = tiles.map((t) => ({
    key: t.pageId,
    src: t.src,
    width: t.width || 4,
    height: t.height || 3,
    alt: t.title,
    srcSet: t.srcSet.length > 1 ? t.srcSet : undefined,
    tile: t
  }))

  return (
    <RowsPhotoAlbum
      photos={photos}
      targetRowHeight={rowHeight}
      spacing={5}
      defaultContainerWidth={1200}
      componentsProps={{ image: { loading: 'lazy', decoding: 'async' } }}
      render={{
        image: (props) => <TileImage {...props} />,
        extras: (_, { photo }) => {
          const t = photo.tile
          const r = rates[t.pageId] ?? 0
          const mark = setup.jury ? null : markOf(setup, r)
          return (
            <>
              {/* the tile opens the large view (a link of its own: the votes are beside it, not inside it) */}
              {t.largeUrl && <a className="wlx-island-open" href={t.largeUrl} aria-label={t.title.replace(/^File:/, '')} />}
              <Caption tile={t} texts={texts} lang={lang} />
              {/* the tile's foot: the chips' row above the votes, so the two never overlap however the stars wrap */}
              <div className="wlx-island-foot">
              <div className="wlx-island-chips">
                {setup.jury && r !== 0 && <span className={`wlx-island-chip ${r < 0 ? 'is-rejected' : 'is-selected'}`}>{markOf(setup, r)}</span>}
                {mark && (setup.viewVotes || !setup.binary) && <span className={`wlx-island-chip ${r < 0 ? 'is-rejected' : 'is-selected'}`}>{mark}</span>}
                {t.approvals !== null && t.rejections !== null && (
                  <span className="wlx-island-chip" title={t.tally ?? undefined} aria-label={t.tally ?? undefined}>✓ {t.approvals} ✗ {t.rejections}</span>
                )}
                {t.comments > 0 && (
                  <span className="wlx-island-chip" title={t.commentsLabel ?? undefined} aria-label={t.commentsLabel ?? undefined}>
                    <i className="bi bi-chat" aria-hidden="true" /> {t.comments}
                  </span>
                )}
              </div>
              {setup.jury && <VoteBar setup={setup} rate={r} busy={!!busy[t.pageId]} texts={texts} onRate={(v) => rate(t, v)} />}
              </div>
            </>
          )
        }
      }}
    />
  )
}
