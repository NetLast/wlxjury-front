import { useMemo } from 'react'
import { Alert, Box, CircularProgress, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useContestsQuery } from '../../api/api'
import { ContestFilters, applyFilter, useContestFilter } from './filters'
import { useRoundStats } from './useRoundStats'

interface Row {
  id: string; name: string; year: number; country: string; round: string
  total: number; rated: number; percent: number
}

const pct = (rated: number, total: number) => (total ? Math.round((100 * rated) / total) : 0)

const columns: GridColDef<Row>[] = [
  { field: 'name', headerName: 'Кампанія', flex: 1.4, minWidth: 180 },
  { field: 'year', headerName: 'Рік', width: 80 },
  { field: 'country', headerName: 'Країна', width: 120 },
  { field: 'round', headerName: 'Тур', width: 130 },
  { field: 'total', headerName: 'Фото', type: 'number', width: 90 },
  { field: 'rated', headerName: 'Оцінено', type: 'number', width: 100 },
  { field: 'percent', headerName: '%', type: 'number', width: 80 }
]

/** Overall statistics and per-year totals, for the filtered campaigns. */
export default function StatsTab() {
  const { data: contests = [], isLoading, error } = useContestsQuery()
  const [filter, setFilter] = useContestFilter()
  const shown = useMemo(() => applyFilter(contests, filter), [contests, filter])
  const roundIds = useMemo(() => shown.flatMap((c) => c.rounds.map((r) => r.id)), [shown])
  const { stats, loading } = useRoundStats(roundIds)

  const rows: Row[] = useMemo(
    () => shown.flatMap((c) => c.rounds.filter((r) => stats[r.id]).map((r) => {
      const s = stats[r.id]
      return {
        id: r.id, name: c.name, year: c.year, country: c.country, round: r.name ?? `Тур ${r.number}`,
        total: s.totalImages, rated: s.ratedImages, percent: pct(s.ratedImages, s.totalImages)
      }
    })),
    [shown, stats]
  )

  const byYear = useMemo(() => {
    const m = new Map<number, { total: number; rated: number }>()
    rows.forEach((r) => {
      const y = m.get(r.year) ?? { total: 0, rated: 0 }
      m.set(r.year, { total: y.total + r.total, rated: y.rated + r.rated })
    })
    return [...m.entries()].sort((a, b) => b[0] - a[0])
  }, [rows])

  const total = rows.reduce((a, r) => a + r.total, 0)
  const rated = rows.reduce((a, r) => a + r.rated, 0)

  return (
    <>
      <ContestFilters contests={contests} value={filter} onChange={setFilter} />
      {(isLoading || loading) && <CircularProgress size={24} />}
      {error && <Alert severity="error">{error.message}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Загалом: {rated} з {total} фото оцінено ({pct(rated, total)}%)</Typography>
        <LinearProgress variant="determinate" value={pct(rated, total)} sx={{ mt: 1 }} />
      </Paper>

      <Stack spacing={2}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Статистика по роках">
            <TableHead><TableRow><TableCell>Рік</TableCell><TableCell align="right">Фото</TableCell><TableCell align="right">Оцінено</TableCell><TableCell align="right">%</TableCell></TableRow></TableHead>
            <TableBody>
              {byYear.map(([y, v]) => (
                <TableRow key={y}><TableCell>{y}</TableCell><TableCell align="right">{v.total}</TableCell><TableCell align="right">{v.rated}</TableCell><TableCell align="right">{pct(v.rated, v.total)}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <DataGrid autoHeight rows={rows} columns={columns} disableRowSelectionOnClick
          initialState={{ sorting: { sortModel: [{ field: 'year', sort: 'desc' }] } }} pageSizeOptions={[10, 25, 100]} />
      </Stack>
    </>
  )
}
