import { Box, Button, Rating } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { useHotkeys } from 'react-hotkeys-hook'
import type { RoundScale } from '../auth/scale'

interface Props {
  scale: RoundScale
  rate: number
  onRate: (rate: number) => void
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * The round's own scale: yes / no (keys Y / N), 1..max stars (keys 1-9, 0 clears, N rejects),
 * nothing for a comments-only round.
 */
export default function RatingControl({ scale, rate, onRate }: Props) {
  const rated = scale.kind === 'rated'
  const binary = scale.kind === 'binary'
  useHotkeys(DIGITS.join(','), (e) => {
    const n = Number(e.key)
    if (n <= scale.max) onRate(n)
  }, { enabled: rated }, [scale, onRate])
  useHotkeys('0', () => onRate(0), { enabled: rated }, [onRate])
  useHotkeys('y', () => onRate(rate === 1 ? 0 : 1), { enabled: binary }, [rate, onRate])
  useHotkeys('n', () => onRate(rate === -1 ? 0 : -1), { enabled: (binary || rated) && scale.rejects }, [rate, onRate])

  if (scale.kind === 'comments') return null

  const reject = scale.rejects && (
    <Button size="small" variant={rate === -1 ? 'contained' : 'outlined'} color="error" startIcon={<CloseIcon />}
      onClick={() => onRate(rate === -1 ? 0 : -1)}>
      Відхилити
    </Button>
  )

  if (binary) {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant={rate === 1 ? 'contained' : 'outlined'} color="success" startIcon={<CheckIcon />} onClick={() => onRate(rate === 1 ? 0 : 1)}>
          Відібрати
        </Button>
        {reject}
      </Box>
    )
  }
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      <Rating size="large" max={scale.max} value={rate > 0 ? rate : null} onChange={(_e, v) => onRate(v ?? 0)} aria-label="Оцінка" />
      {reject}
    </Box>
  )
}
