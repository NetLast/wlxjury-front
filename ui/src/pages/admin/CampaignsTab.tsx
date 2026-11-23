import { Alert, Button, CircularProgress, Stack } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { Link as RouterLink } from 'react-router-dom'
import { useContestsQuery } from '../../api/api'
import type { ContestInfo } from '../../types'
import { ContestFilters, applyFilter, useContestFilter } from './filters'

const columns: GridColDef<ContestInfo>[] = [
  { field: 'name', headerName: 'Назва', flex: 1.4, minWidth: 180 },
  { field: 'year', headerName: 'Рік', width: 90 },
  { field: 'country', headerName: 'Країна', width: 130 },
  { field: 'campaign', headerName: 'Кампанія', width: 130 },
  {
    field: 'rounds', headerName: 'Тури (фото)', flex: 1.6, minWidth: 220, sortable: false,
    renderCell: ({ row }) => (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
        {row.rounds.map((r) => (
          <Button key={r.id} size="small" variant={r.active ? 'contained' : 'outlined'} component={RouterLink} to={`/rounds/${r.id}`}>
            {r.name ?? `Тур ${r.number}`}
          </Button>
        ))}
      </Stack>
    )
  }
]

/** All campaigns, sortable by any column (name first), with the filters. Photos are one click away. */
export default function CampaignsTab() {
  const { data = [], isLoading, error } = useContestsQuery()
  const [filter, setFilter] = useContestFilter()
  return (
    <>
      <ContestFilters contests={data} value={filter} onChange={setFilter} />
      {isLoading && <CircularProgress />}
      {error && <Alert severity="error">{error.message}</Alert>}
      <DataGrid
        autoHeight
        rows={applyFilter(data, filter)}
        columns={columns}
        getRowId={(r) => r.id}
        disableRowSelectionOnClick
        initialState={{ sorting: { sortModel: [{ field: 'name', sort: 'asc' }] } }}
        pageSizeOptions={[10, 25, 100]}
      />
    </>
  )
}
