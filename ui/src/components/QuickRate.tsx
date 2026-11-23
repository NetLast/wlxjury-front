import { useState } from 'react'
import { Box, IconButton, Menu, MenuItem, Rating } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import StarIcon from '@mui/icons-material/Star'
import type { RoundScale } from '../auth/scale'

interface Props {
  scale: RoundScale
  rate: number
  /** the tile's width, px: a long scale does not fit a narrow tile as stars */
  width: number
  onRate: (rate: number) => void
}

const STAR_WIDTH = 20

/** Rates a photo straight from the grid, without opening it (shown on hover; always on touch screens). */
export default function QuickRate({ scale, rate, width, onRate }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  if (scale.kind === 'comments') return null

  const rejectBtn = scale.rejects && (
    <IconButton size="small" aria-label="Відхилити" onClick={() => onRate(rate === -1 ? 0 : -1)}
      sx={{ color: rate === -1 ? 'error.main' : '#fff', bgcolor: rate === -1 ? '#fff' : 'transparent' }}>
      <CloseIcon fontSize="small" />
    </IconButton>
  )

  let control
  if (scale.kind === 'binary') {
    control = (
      <IconButton size="small" aria-label="Відібрати" onClick={() => onRate(rate === 1 ? 0 : 1)}
        sx={{ color: rate === 1 ? 'success.main' : '#fff', bgcolor: rate === 1 ? '#fff' : 'transparent' }}>
        <CheckIcon fontSize="small" />
      </IconButton>
    )
  } else if (width >= scale.max * STAR_WIDTH + 70) {
    control = (
      <Rating size="small" max={scale.max} value={rate > 0 ? rate : null} onChange={(_e, v) => onRate(v ?? 0)}
        aria-label="Швидка оцінка" sx={{ '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,.6)' } }} />
    )
  } else {
    // a narrow tile or a long scale: one button that opens the list of marks
    control = (
      <>
        <IconButton size="small" aria-label="Оцінити" onClick={(e) => setAnchor(e.currentTarget)} sx={{ color: '#fff', borderRadius: 1, fontSize: 14 }}>
          <StarIcon fontSize="small" />&nbsp;{rate > 0 ? rate : '–'}
        </IconButton>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
          {Array.from({ length: scale.max }, (_, i) => scale.max - i).map((n) => (
            <MenuItem key={n} selected={n === rate} onClick={() => { setAnchor(null); onRate(n) }}>{n}</MenuItem>
          ))}
          <MenuItem onClick={() => { setAnchor(null); onRate(0) }}>Скинути</MenuItem>
        </Menu>
      </>
    )
  }

  return (
    <Box className="wlx-quick" sx={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2, display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 0.5, py: 0.25, bgcolor: 'rgba(0,0,0,.6)'
    }}>
      {control}
      {rejectBtn}
    </Box>
  )
}
