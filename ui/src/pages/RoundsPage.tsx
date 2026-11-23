import { Card, CardActionArea, CardContent, Container, Typography, Stack, Chip, CircularProgress, Alert } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useContestsQuery } from '../api/api'
import TopBar from '../components/TopBar'

/** Jury and screener: the campaigns (rounds) they can open. */
export default function RoundsPage() {
  const { data, isLoading, error } = useContestsQuery()
  const rounds = (data ?? []).flatMap((c) => c.rounds.filter((r) => r.active).map((r) => ({ c, r })))

  return (
    <>
      <TopBar title="Мої кампанії" />
      <Container sx={{ py: 2 }}>
        {isLoading && <CircularProgress />}
        {error && <Alert severity="error">{error.message}</Alert>}
        {!isLoading && !error && rounds.length === 0 && <Alert severity="info">Немає активних турів.</Alert>}
        <Stack spacing={1.5}>
          {rounds.map(({ c, r }) => (
            <Card key={r.id}>
              <CardActionArea component={RouterLink} to={`/rounds/${r.id}`}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ flex: 1 }}>{c.name} – {c.year}</Typography>
                  <Chip label={r.name ?? `Тур ${r.number}`} />
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </Container>
    </>
  )
}
