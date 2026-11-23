import type { GallerySetup, Texts } from './tiles'

interface Props {
  setup: GallerySetup
  rate: number
  busy: boolean
  texts: Texts
  onRate: (rate: number) => void
}

/**
 * A tile's votes, as tile-votes.js draws them: a binary round's ✓ and ✗ (pressed again: the vote
 * cleared), a rated round's stars (two units per star in half stars) with the worst mark ✗ where
 * the round takes it, and "clear". Shown while the tile is pointed at or focused (always on a
 * touch screen), never taking the click that opens the large view.
 */
export default function VoteBar({ setup, rate, busy, texts, onRate }: Props) {
  if (setup.binary) {
    return (
      <div className="wlx-island-votes" aria-busy={busy}>
        <button type="button" className="wlx-island-btn" aria-pressed={rate === 1} aria-label={texts.selected} title={texts.selected}
          disabled={busy} onClick={() => onRate(rate === 1 ? 0 : 1)}>
          <i className="bi bi-check-lg" aria-hidden="true" />
        </button>
        <button type="button" className="wlx-island-btn wlx-island-reject" aria-pressed={rate === -1} aria-label={texts.rejected} title={texts.rejected}
          disabled={busy} onClick={() => onRate(rate === -1 ? 0 : -1)}>
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>
    )
  }
  const stars = setup.stars
  if (!stars) return null
  const units = stars.half ? 2 : 1
  const shown = rate > 0 ? rate / units : 0
  const star = (i: number) => {
    const icon = shown >= i ? 'bi-star-fill' : shown >= i - 0.5 ? 'bi-star-half' : 'bi-star'
    const full = i * units
    return (
      <span key={i} className="wlx-island-star">
        <i className={`bi ${icon}`} aria-hidden="true" />
        {stars.half && (
          <button type="button" className="wlx-island-half wlx-island-half-left" aria-label={String(i - 0.5)} title={String(i - 0.5)}
            aria-pressed={rate === full - 1} disabled={busy} onClick={() => onRate(full - 1)} />
        )}
        <button type="button" className={stars.half ? 'wlx-island-half wlx-island-half-right' : 'wlx-island-half wlx-island-whole'}
          aria-label={String(i)} title={String(i)} aria-pressed={rate === full} disabled={busy} onClick={() => onRate(full)} />
      </span>
    )
  }
  return (
    <div className="wlx-island-votes" aria-busy={busy}>
      <span className="wlx-island-stars">{Array.from({ length: stars.number }, (_, i) => star(i + 1))}</span>
      {stars.worst && (
        <button type="button" className="wlx-island-btn wlx-island-reject" aria-pressed={rate === -1} aria-label={texts.worst} title={texts.worst}
          disabled={busy} onClick={() => onRate(rate === -1 ? 0 : -1)}>
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      )}
      {rate !== 0 && (
        <button type="button" className="wlx-island-btn" aria-label={texts.clear} title={texts.clear} disabled={busy} onClick={() => onRate(0)}>
          <i className="bi bi-eraser" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
