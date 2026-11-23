import { useState } from 'react'
import { Box, Dialog, IconButton, Link, Stack, Typography, Button, useMediaQuery, useTheme } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import { useHotkeys } from 'react-hotkeys-hook'
import FallbackImg from './FallbackImg'
import RatingControl from './RatingControl'
import Comments from './Comments'
import CommonsInfo from './CommonsInfo'
import type { ImageWithRating, Role } from '../types'

interface Props {
  items: ImageWithRating[]
  index: number
  role: Role
  roundId: string
  onIndex: (i: number) => void
  onClose: () => void
  onRate: (pageId: string, rate: number) => void
}

export const myRate = (x: ImageWithRating) => x.selections[0]?.rate ?? 0

/** Big photo with a thumbnail strip (wireframe): info line, rating, Commons link, comments. */
export default function DetailView({ items, index, role, roundId, onIndex, onClose, onRate }: Props) {
  const theme = useTheme()
  const narrow = useMediaQuery(theme.breakpoints.down('md'))
  const [zoom, setZoom] = useState(false)
  const item = items[index]

  useHotkeys('left', () => index > 0 && onIndex(index - 1), [index])
  useHotkeys('right', () => index < items.length - 1 && onIndex(index + 1), [index, items.length])

  if (!item) return null
  const { image } = item

  return (
    <Dialog fullScreen open onClose={onClose}>
      <Box sx={{ display: 'flex', height: '100%', flexDirection: narrow ? 'column-reverse' : 'row' }}>
        <Stack
          direction={narrow ? 'row' : 'column'}
          spacing={1}
          sx={{ p: 1, overflow: 'auto', flex: narrow ? '0 0 84px' : '0 0 150px', bgcolor: 'grey.100' }}
        >
          {items.map((x, i) => (
            <Box
              key={x.image.pageId}
              ref={(el: HTMLElement | null) => { if (i === index) el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }) }}
              onClick={() => onIndex(i)}
              sx={{ cursor: 'pointer', flex: '0 0 auto', border: 2, borderColor: i === index ? 'primary.main' : 'transparent' }}
            >
              <FallbackImg src={x.image.url ?? undefined} loading="lazy" style={{ display: 'block', width: narrow ? 70 : '100%', height: narrow ? 60 : 'auto', objectFit: 'cover' }} />
            </Box>
          ))}
        </Stack>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, p: 1.5, gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ flex: 1 }} noWrap>
              {image.title.replace(/^File:/, '')} · {image.width}×{image.height}{image.mpx ? ` (${image.mpx} Мп)` : ''}
              {image.author ? ` · ${image.author}` : ''}
            </Typography>
            <IconButton onClick={onClose} aria-label="Закрити"><CloseIcon /></IconButton>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'grey.900' }}>
            <FallbackImg
              src={image.url ?? undefined}
              onClick={() => setZoom(true)}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'zoom-in' }}
            />
          </Box>

          <CommonsInfo title={image.title} />
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
            <RatingControl role={role} rate={myRate(item)} onRate={(r) => onRate(image.pageId, r)} />
            {image.pageUrl && (
              <Button component={Link} href={image.pageUrl} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNewIcon />}>
                Перейти на Commons
              </Button>
            )}
          </Stack>
          <Comments roundId={roundId} pageId={image.pageId} />
        </Box>
      </Box>
      <Lightbox open={zoom} close={() => setZoom(false)} slides={[{ src: image.url ?? '' }]} plugins={[Zoom]} />
    </Dialog>
  )
}
