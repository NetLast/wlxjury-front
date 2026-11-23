import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, CircularProgress, IconButton, MenuItem, Select, Slider, Stack, Tooltip, Typography } from '@mui/material'
import AllInclusiveIcon from '@mui/icons-material/AllInclusive'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import BarChartIcon from '@mui/icons-material/BarChart'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { RowsPhotoAlbum, MasonryPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/rows.css'
import 'react-photo-album/masonry.css'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useLazyImagesQuery, useRateImageMutation, useRoundQuery, useContestsQuery } from '../api/api'
import { roleOf } from '../auth/roles'
import DetailView, { myRate } from '../components/DetailView'
import FallbackImg from '../components/FallbackImg'
import TopBar from '../components/TopBar'
import { setRowHeight } from '../store/uiSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { ImageWithRating } from '../types'

const PAGE_SIZE = 40
/** all | unrated | a specific rate; the backend filters by exact rate */
type Filter = 'all' | number
type Sort = 'default' | 'name' | 'rating'

export default function GalleryPage() {
  const { roundId = '' } = useParams()
  const user = useAppSelector((s) => s.auth.user)
  const role = roleOf(user)
  const { rowHeight } = useAppSelector((s) => s.ui)
  const dispatch = useAppDispatch()

  const { data: round } = useRoundQuery(roundId)
  const { data: contests } = useContestsQuery()
  const contest = contests?.find((c) => c.id === round?.contestId)

  const [filter, setFilter] = useState<Filter>('all')
  const [items, setItems] = useState<ImageWithRating[]>([])
  const [page, setPage] = useState(1)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [sort, setSort] = useState<Sort>('default')
  const [fetchImages] = useLazyImagesQuery()
  const [rateImage] = useRateImageMutation()
  const loadingRef = useRef(false)

  // an admin sees the grouped result of all jurors (no userId); jury and screener see their own votes
  const userId = role === 'admin' ? undefined : user?.id

  // `epoch` changes with the round / filter: an answer to an older request is dropped,
  // so switching the filter while a page is loading can't mix two result sets
  const epoch = useRef(0)
  const reset = useCallback(() => {
    epoch.current += 1
    loadingRef.current = false
    setItems([]); setPage(1); setDone(false); setError(null)
  }, [])
  useEffect(reset, [roundId, filter, reset])

  useEffect(() => {
    if (!roundId || done || loadingRef.current) return
    const mine = epoch.current
    loadingRef.current = true
    setLoading(true)
    fetchImages({ roundId, userId, page, pageSize: PAGE_SIZE, rate: filter === 'all' ? undefined : filter })
      .unwrap()
      .then((list) => {
        if (mine !== epoch.current) return
        setItems((prev) => (page === 1 ? list : [...prev, ...list]))
        if (list.length < PAGE_SIZE) setDone(true)
      })
      .catch((e: { message?: string }) => {
        if (mine !== epoch.current) return
        setError(e.message ?? 'Не вдалося завантажити фото'); setDone(true)
      })
      .finally(() => {
        if (mine !== epoch.current) return
        loadingRef.current = false; setLoading(false)
      })
  }, [roundId, userId, page, filter, done, fetchImages])

  // infinite scroll: load the next page when the sentinel is near
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting && !loadingRef.current && !done) setPage((p) => p + 1)
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [done, items.length])

  const onRate = (pageId: string, rate: number) => {
    setItems((prev) => prev.map((x) => (x.image.pageId === pageId ? { ...x, selections: [{ rate }] } : x)))
    rateImage({ roundId, pageId, rate }).unwrap().catch(() => setError('Не вдалося зберегти оцінку'))
  }

  // sorting works on the loaded photos only (the backend pages them in its own order)
  const view = useMemo(() => {
    if (sort === 'name') return [...items].sort((a, b) => a.image.title.localeCompare(b.image.title, 'uk', { numeric: true }))
    if (sort === 'rating') return [...items].sort((a, b) => (role === 'admin' ? b.rateSum - a.rateSum : myRate(b) - myRate(a)))
    return items
  }, [items, sort, role])

  const photos = view.map((x) => ({
    key: x.image.pageId,
    src: x.image.url ?? '',
    width: x.image.width,
    height: x.image.height,
    alt: x.image.title,
    item: x
  }))

  const badge = (x: ImageWithRating) => {
    const r = myRate(x)
    if (role === 'admin') return x.rateSum ? `Σ ${x.rateSum}` : null
    if (r === 0) return null
    return role === 'jury' ? `${r}★` : r > 0 ? '✓' : '✗'
  }

  const render = {
    image: (props: object) => <FallbackImg {...props} />,
    extras: (_: unknown, { photo }: { photo: (typeof photos)[number] }) => {
      const b = badge(photo.item)
      return b ? (
        <Box sx={{ position: 'absolute', right: 6, top: 6, px: 0.75, borderRadius: 1, bgcolor: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 13 }}>{b}</Box>
      ) : null
    }
  }
  // hover shows the extra info (title, author, size) via the native tooltip
  const titled = photos.map((p) => ({ ...p, title: `${p.alt.replace(/^File:/, '')} · ${p.width}×${p.height}${p.item.image.author ? ` · ${p.item.image.author}` : ''}` }))

  const title = contest ? `${contest.campaign ?? contest.name} – ${contest.year}` : 'Галерея'
  const iconFor = (value: Filter, label: string, icon: React.ReactNode) => (
    <Tooltip title={label}>
      <IconButton color={filter === value ? 'primary' : 'default'} onClick={() => setFilter(value)} aria-label={label}>{icon}</IconButton>
    </Tooltip>
  )

  return (
    <>
      <TopBar title={title}>
        <IconButton component={RouterLink} to={role === 'admin' ? '/admin' : '/rounds'} aria-label="Назад"><ArrowBackIcon /></IconButton>
        {iconFor('all', 'Усі', <AllInclusiveIcon />)}
        {iconFor(0, 'Без оцінки', <RadioButtonUncheckedIcon />)}
        {role === 'screener' && iconFor(1, 'Відібрані', <CheckIcon />)}
        {role === 'screener' && iconFor(-1, 'Відхилені', <CloseIcon />)}
        {role === 'jury' && (
          <Select<number | ''> size="small" value={typeof filter === 'number' && filter > 0 ? filter : ''} displayEmpty
            onChange={(e) => setFilter(e.target.value === '' ? 'all' : Number(e.target.value))} sx={{ mx: 0.5, minWidth: 72 }}>
            <MenuItem value="">★</MenuItem>
            {[5, 4, 3, 2, 1].map((n) => <MenuItem key={n} value={n}>{n}★</MenuItem>)}
          </Select>
        )}
        <Select<Sort> size="small" value={sort} onChange={(e) => setSort(e.target.value as Sort)} sx={{ mx: 0.5, minWidth: 120 }} aria-label="Сортування">
          <MenuItem value="default">За замовчуванням</MenuItem>
          <MenuItem value="name">За назвою</MenuItem>
          <MenuItem value="rating">За оцінкою</MenuItem>
        </Select>
        {role === 'admin' && round && (
          <Tooltip title="Статистика"><IconButton component={RouterLink} to={`/admin/rounds/${roundId}/stats`} aria-label="Статистика"><BarChartIcon /></IconButton></Tooltip>
        )}
      </TopBar>

      {role === 'screener' && (
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", px: 2, pt: 1, maxWidth: 420 }}>
          <Typography variant="body2" noWrap>Розмір фото</Typography>
          <Slider size="small" min={90} max={420} step={10} value={rowHeight} onChange={(_e, v) => dispatch(setRowHeight(v as number))} aria-label="Розмір фото" />
        </Stack>
      )}

      <Box sx={{ p: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        {!loading && !error && items.length === 0 && <Alert severity="info">У цій вибірці немає фото.</Alert>}
        <RowsPhotoAlbum
          photos={titled}
          targetRowHeight={rowHeight}
          spacing={6}
          defaultContainerWidth={1200}
          render={render as never}
          onClick={({ index }) => setOpen(index)}
          componentsProps={{ image: { loading: 'lazy' } }}
        />
        <Box ref={sentinel} sx={{ height: 40, display: 'grid', placeItems: 'center' }}>{loading && <CircularProgress size={24} />}</Box>
      </Box>

      {open !== null && role && (
        <DetailView items={view} index={open} role={role} roundId={roundId}
          onIndex={setOpen} onClose={() => setOpen(null)} onRate={onRate} />
      )}
    </>
  )
}
// MasonryPhotoAlbum is kept imported for the layout switch (see uiSlice.layout)
void MasonryPhotoAlbum
