import { useMemo, useState } from 'react'
import { FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import type { ContestInfo } from '../../types'

export interface ContestFilter { country: string; year: number | ''; campaign: string }

export const emptyFilter: ContestFilter = { country: '', year: '', campaign: '' }

export function applyFilter(contests: ContestInfo[], f: ContestFilter): ContestInfo[] {
  const q = f.campaign.trim().toLowerCase()
  return contests.filter(
    (c) =>
      (!f.country || c.country === f.country) &&
      (!f.year || c.year === f.year) &&
      (!q || `${c.name} ${c.campaign ?? ''}`.toLowerCase().includes(q))
  )
}

export function useContestFilter() {
  return useState<ContestFilter>(emptyFilter)
}

/** Country / year / campaign filter shared by the admin tabs. */
export function ContestFilters({ contests, value, onChange }: {
  contests: ContestInfo[]; value: ContestFilter; onChange: (f: ContestFilter) => void
}) {
  const countries = useMemo(() => [...new Set(contests.map((c) => c.country))].sort(), [contests])
  const years = useMemo(() => [...new Set(contests.map((c) => c.year))].sort((a, b) => b - a), [contests])
  return (
    <Stack direction="row" spacing={2} useFlexGap sx={{ mb: 2, flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Країна</InputLabel>
        <Select label="Країна" value={value.country} onChange={(e) => onChange({ ...value, country: e.target.value })}>
          <MenuItem value="">Усі</MenuItem>
          {countries.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 110 }}>
        <InputLabel>Рік</InputLabel>
        <Select label="Рік" value={value.year} onChange={(e) => onChange({ ...value, year: e.target.value as number | '' })}>
          <MenuItem value="">Усі</MenuItem>
          {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </Select>
      </FormControl>
      <TextField size="small" label="Кампанія" value={value.campaign} onChange={(e) => onChange({ ...value, campaign: e.target.value })} />
    </Stack>
  )
}
