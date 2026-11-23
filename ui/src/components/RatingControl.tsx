import { Box, Button, Rating } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { useHotkeys } from 'react-hotkeys-hook'
import type { Role } from '../types'

interface Props {
  role: Role
  rate: number
  onRate: (rate: number) => void
}

/** Jury: five stars (keys 1-5). Screener: select / reject (keys Y / N). */
export default function RatingControl({ role, rate, onRate }: Props) {
  useHotkeys('1,2,3,4,5', (e) => role === 'jury' && onRate(Number(e.key)), { enabled: role === 'jury' }, [role, onRate])
  useHotkeys('y', () => onRate(rate === 1 ? 0 : 1), { enabled: role === 'screener' }, [role, rate, onRate])
  useHotkeys('n', () => onRate(rate === -1 ? 0 : -1), { enabled: role === 'screener' }, [role, rate, onRate])

  if (role === 'jury') {
    return (
      <Rating
        size="large"
        value={rate > 0 ? rate : null}
        onChange={(_e, v) => onRate(v ?? 0)}
        aria-label="Оцінка"
      />
    )
  }
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button variant={rate === 1 ? 'contained' : 'outlined'} color="success" startIcon={<CheckIcon />} onClick={() => onRate(rate === 1 ? 0 : 1)}>
        Відібрати
      </Button>
      <Button variant={rate === -1 ? 'contained' : 'outlined'} color="error" startIcon={<CloseIcon />} onClick={() => onRate(rate === -1 ? 0 : -1)}>
        Відхилити
      </Button>
    </Box>
  )
}
