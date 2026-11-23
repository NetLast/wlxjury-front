import { Alert, Box, CircularProgress, Container, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography, IconButton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useRoundStatQuery } from '../api/api'
import TopBar from '../components/TopBar'

export default function StatsPage() {
  const { roundId = '' } = useParams()
  const { data, isLoading, error } = useRoundStatQuery(roundId)
  const pct = data && data.totalImages ? Math.round((100 * data.ratedImages) / data.totalImages) : 0

  return (
    <>
      <TopBar title="Статистика туру">
        <IconButton component={RouterLink} to={`/rounds/${roundId}`} aria-label="Назад"><ArrowBackIcon /></IconButton>
      </TopBar>
      <Container sx={{ py: 2 }}>
        {isLoading && <CircularProgress />}
        {error && <Alert severity="error">{error.message}</Alert>}
        {data && (
          <>
            <Typography>Оцінено {data.ratedImages} з {data.totalImages} ({pct}%)</Typography>
            <LinearProgress variant="determinate" value={pct} sx={{ my: 1 }} />
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead><TableRow><TableCell>Журі</TableCell><TableCell align="right">Оцінено</TableCell><TableCell align="right">Відібрано</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.jurorStats.map((j) => (
                    <TableRow key={j.user.id}><TableCell>{j.user.fullname}</TableCell><TableCell align="right">{j.rated}</TableCell><TableCell align="right">{j.selected}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </>
        )}
      </Container>
    </>
  )
}
