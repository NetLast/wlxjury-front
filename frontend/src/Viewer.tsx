import Lightbox, { type Slide } from 'yet-another-react-lightbox'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import Caption from './Caption'
import VoteBar from './VoteBar'
import type { GallerySetup, Texts, Tile } from './tiles'

interface Props {
  tiles: Tile[]
  index: number
  setup: GallerySetup
  texts: Texts
  lang: string
  rates: Record<string, number>
  busy: Record<string, boolean>
  onIndex: (i: number) => void
  onClose: () => void
  onRate: (tile: Tile, rate: number) => void
}

type TileSlide = Slide & { tile: Tile }

/**
 * The enlarged photo, on the gallery page: the thumbnails' strip at the side (the sketch), the
 * picture (zoom by wheel, double click or pinch; arrows go on), and under it what the viewer may
 * see about the file, the votes, and the links to the large view page and to Commons.
 */
export default function Viewer({ tiles, index, setup, texts, lang, rates, busy, onIndex, onClose, onRate }: Props) {
  const slides: TileSlide[] = tiles.map((t) => ({
    src: t.large || t.src,
    alt: t.title,
    width: t.width || undefined,
    height: t.height || undefined,
    srcSet: t.srcSet.length > 1 ? t.srcSet : undefined,
    tile: t
  }))
  return (
    <Lightbox
      open
      index={index}
      slides={slides}
      close={onClose}
      on={{ view: ({ index: i }) => onIndex(i) }}
      plugins={[Thumbnails, Zoom]}
      thumbnails={{ position: 'start', width: 96, height: 72, border: 0, gap: 6, imageFit: 'cover' }}
      zoom={{ maxZoomPixelRatio: 2, scrollToZoom: true }}
      // room under the picture for the panel, so it never covers the photo
      styles={{ slide: { padding: '16px 16px 132px' } }}
      labels={{ Close: texts.close, Previous: texts.previous, Next: texts.next }}
      className="wlx-island-viewer"
      render={{
        // zoom by wheel, double click or pinch: no zoom buttons (their names aren't translated)
        buttonZoom: () => null,
        slideFooter: ({ slide }) => {
          const t = (slide as TileSlide).tile
          return (
            <div className="wlx-island-panel">
              <Caption tile={t} texts={texts} lang={lang} />
              {setup.jury && (
                <VoteBar setup={setup} rate={rates[t.pageId] ?? 0} busy={!!busy[t.pageId]} texts={texts} onRate={(v) => onRate(t, v)} />
              )}
            </div>
          )
        }
      }}
    />
  )
}
