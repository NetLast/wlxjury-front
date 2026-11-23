import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Chip, CircularProgress, GlobalStyles, IconButton, MenuItem, Select, Slider, Stack, Tooltip, Typography } from '@mui/material'
import BarChartIcon from '@mui/icons-material/BarChart'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { RowsPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/rows.css'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  useContestsQuery, useLazyImagesQuery, useRateImageMutation, useRateSummaryQuery, useRoundQuery, useRoundScaleQuery
} from '../api/api'
import { fallbackScale, positiveRates, scaleOf, type RoundScale } from '../auth/scale'
import { roleOf } from '../auth/roles'
import { NO_REGION, regionName, regionOf } from '../data/regions'
import DetailView, { myRate } from '../components/DetailView'
import FallbackImg from '../components/FallbackImg'
import QuickRate from '../components/QuickRate'
import TopBar from '../components/TopBar'
import { setRowHeight } from '../store/uiSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { ImageWithRating } from '../types'

type Mode = 'all' | 'accepted' | 'rejected' | 'unrated'
type Sort = 'default' | 'rating' | 'region' | 'name'
type Rate = number | undefined

const PAGE_SIZE = 40
const PAGE_SIZE_ALL = 200

/**
 * The backend filters by one exact rate, so a mode (and "by rating") is a queue of rates read one
 * after another, best first: the list then comes in the right order from the server, page by page.
 */
export function queueFor(mode: Mode, sort: Sort, scale: RoundScale, isAdmin: boolean): Rate[] {
  if (isAdmin || scale.kind === 'comments') return [undefined]
  const positive = positiveRates(scale)
  if (mode === 'unrated') return [0]
  if (mode === 'rejected') return [-1]
  if (mode === 'accepted') return positive
  return sort === 'rating' ? [...positive, 0, ...(scale.rejects ? [-1] : [])] : [undefined]
}

interface Group { key: string; title: string | null; items: ImageWithRating[] }

export function groupByRegion(items: ImageWithRating[]): Group[] {
  const map = new Map<string, ImageWithRating[]>()
  items.forEach((x) => {
    const code = regionOf(x.image.monumentId)
    map.set(code, [...(map.get(code) ?? []), x])
  })
  return [...map.entries()]
    .sort(([a], [b]) => (a === NO_REGION ? 1 : b === NO_REGION ? -1 : regionName(a).localeCompare(regionName(b), 'uk')))
    .map(([key, list]) => ({ key, title: `${regionName(key)} (${list.length})`, items: list }))
}

const tileStyles = (
  <GlobalStyles styles={{
    '.react-photo-album--photo': { position: 'relative' },
    '.wlx-open': { position: 'absolute', inset: 0, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', zIndex: 1 },
    '.wlx-quick': { opacity: 0, transition: 'opacity .15s' },
    '.react-photo-album--photo:hover .wlx-quick, .wlx-quick:focus-within': { opacity: 1 },
    '@media (hover: none)': { '.wlx-quick': { opacity: 1 } }
  }} />
)

export default function GalleryPage() {
  const { roundId = '' } = useParams()
  const user = useAppSelector((s) => s.auth.user)
  const role = roleOf(user)
  const isAdmin = role === 'admin'
  const { rowHeight } = useAppSelector((s) => s.ui)
  const dispatch = useAppDispatch()

  const { data: round } = useRoundQuery(roundId)
  const { data: contests } = useContestsQuery()
  const contest = contests?.find((c) => c.id === round?.contestId)

  // the round's own scale (adaptive marks); until the backend exposes it, a default per role
  const { data: scaleData, isLoading: scaleLoading } = useRoundScaleQuery(roundId)
  const scale = useMemo(
    () => (scaleData ? scaleOf(scaleData.rates, scaleData.rejects) : fallbackScale(role)),
    [scaleData, role]
  )

  const [mode, setMode] = useState<Mode>('all')
  const [sort, setSort] = useState<Sort>('default')
  const [items, setItems] = useState<ImageWithRating[]>([])
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [fetchImages] = useLazyImagesQuery()
  const [rateImage] = useRateImageMutation()
  const loadingRef = useRef(false)

  // an admin sees the grouped result of all jurors (no userId); the others see their own votes
  const userId = isAdmin ? undefined : user?.id
  const autoAll = sort === 'region' // grouping needs every photo: read all pages
  const pageSize = autoAll ? PAGE_SIZE_ALL : PAGE_SIZE

  const queue = useMemo(() => queueFor(mode, sort, scale, isAdmin), [mode, sort, scale, isAdmin])
  const queueKey = `${roundId}|${queue.join(',')}|${pageSize}`
  const [cursor, setCursor] = useState({ key: queueKey, qi: 0, page: 1 })

  // `epoch` changes with what is shown: an answer to an older request is dropped
  const epoch = useRef(0)
  const reset = useCallback(() => {
    epoch.current += 1
    loadingRef.current = false
    setLoading(false)
    setItems([]); setDone(false); setError(null)
    setCursor({ key: queueKey, qi: 0, page: 1 })
  }, [queueKey])
  useEffect(reset, [reset])

  useEffect(() => {
    if (!roundId || scaleLoading || done || loadingRef.current || cursor.key !== queueKey) return
    const mine = epoch.current
    loadingRef.current = true
    setLoading(true)
    fetchImages({ roundId, userId, page: cursor.page, pageSize, rate: queue[cursor.qi] })
      .unwrap()
      .then((list) => {
        if (mine !== epoch.current) return
        loadingRef.current = false
        setItems((prev) => (cursor.page === 1 && cursor.qi === 0 ? list : [...prev, ...list]))
        if (list.length < pageSize) {
          if (cursor.qi + 1 < queue.length) setCursor((c) => ({ ...c, qi: c.qi + 1, page: 1 }))
          else setDone(true)
        } else if (autoAll) {
          setCursor((c) => ({ ...c, page: c.page + 1 }))
        }
      })
      .catch((e: { message?: string }) => {
        if (mine !== epoch.current) return
        setError(e.message ?? 'Не вдалося завантажити фото'); setDone(true)
      })
      .finally(() => {
        if (mine !== epoch.current) return
        loadingRef.current = false; setLoading(false)
      })
  }, [roundId, userId, cursor, queue, queueKey, pageSize, autoAll, done, scaleLoading, fetchImages])

  // infinite scroll: the next page when the sentinel is near
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting && !loadingRef.current && !done) setCursor((c) => ({ ...c, page: c.page + 1 }))
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [done, items.length])

  // the juror's votes in the whole round (tiny): the counts of accepted / rejected / unrated
  const { data: summary } = useRateSummaryQuery({ roundId, userId: user?.id ?? '' }, { skip: isAdmin || !user })
  const [votes, setVotes] = useState<Record<string, number>>({})
  useEffect(() => { if (summary) setVotes(summary) }, [summary])
  const counts = useMemo(() => {
    const all = Object.values(votes)
    return {
      total: all.length,
      accepted: all.filter((r) => r > 0).length,
      rejected: all.filter((r) => r < 0).length,
      unrated: all.filter((r) => r === 0).length
    }
  }, [votes])

  const onRate = (pageId: string, rate: number) => {
    setItems((prev) => prev.map((x) => (x.image.pageId === pageId ? { ...x, selections: [{ rate }] } : x)))
    setVotes((v) => ({ ...v, [pageId]: rate }))
    rateImage({ roundId, pageId, rate }).unwrap().catch(() => setError('Не вдалося зберегти оцінку'))
  }

  const groups: Group[] = useMemo(() => {
    let list = items
    if (sort === 'name') list = [...items].sort((a, b) => a.image.title.localeCompare(b.image.title, 'uk', { numeric: true }))
    if (sort === 'rating' && isAdmin) list = [...items].sort((a, b) => b.rateSum - a.rateSum)
    if (sort === 'region') {
      const byRate = [...items].sort((a, b) => (isAdmin ? b.rateSum - a.rateSum : myRate(b) - myRate(a)))
      return groupByRegion(byRate)
    }
    return [{ key: 'all', title: null, items: list }]
  }, [items, sort, isAdmin])
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  const badge = (x: ImageWithRating) => {
    if (isAdmin) return x.rateSum ? `Σ ${x.rateSum}` : null
    const r = myRate(x)
    if (r === 0) return null
    if (r < 0) return '✗'
    return scale.kind === 'binary' ? '✓' : `${r}★`
  }

  const renderFor = (offset: number) => ({
    image: (props: object) => <FallbackImg {...props} />,
    extras: (_: unknown, ctx: { photo: { alt: string; item: ImageWithRating }; index: number; width: number }) => {
      const b = badge(ctx.photo.item)
      return (
        <>
          <button type="button" className="wlx-open" aria-label={ctx.photo.alt} onClick={() => setOpen(offset + ctx.index)} />
          {b && <Box sx={{ position: 'absolute', right: 6, top: 6, zIndex: 2, px: 0.75, borderRadius: 1, bgcolor: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 13, pointerEvents: 'none' }}>{b}</Box>}
          {!isAdmin && <QuickRate scale={scale} rate={myRate(ctx.photo.item)} width={ctx.width} onRate={(r) => onRate(ctx.photo.item.image.pageId, r)} />}
        </>
      )
    }
  })

  const title = contest ? `${contest.campaign ?? contest.name} – ${contest.year}` : 'Галерея'
  const chip = (value: Mode, label: string, n: number | null) => (
    <Chip key={value} label={`${label} ${n ?? '…'}`} color={mode === value ? 'primary' : 'default'}
      variant={mode === value ? 'filled' : 'outlined'} onClick={() => setMode(value)} />
  )

  let offset = 0
  return (
    <>
      {tileStyles}
      <TopBar title={title}>
        <IconButton component={RouterLink} to={isAdmin ? '/admin' : '/rounds'} aria-label="Назад"><ArrowBackIcon /></IconButton>
        <Select<Sort> size="small" value={sort} onChange={(e) => setSort(e.target.value as Sort)} sx={{ mx: 0.5, minWidth: 130 }} aria-label="Сортування">
          <MenuItem value="default">За замовчуванням</MenuItem>
          <MenuItem value="rating">За оцінкою</MenuItem>
          <MenuItem value="region">За областями</MenuItem>
          <MenuItem value="name">За назвою</MenuItem>
        </Select>
        {isAdmin && round && (
          <Tooltip title="Статистика"><IconButton component={RouterLink} to={`/admin/rounds/${roundId}/stats`} aria-label="Статистика"><BarChartIcon /></IconButton></Tooltip>
        )}
      </TopBar>

      {!isAdmin && scale.kind !== 'comments' && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ px: 2, pt: 1, flexWrap: 'wrap' }} aria-label="Статистика оцінок">
          {chip('all', 'Усі', summary ? counts.total : null)}
          {chip('accepted', 'Прийняті', summary ? counts.accepted : null)}
          {scale.rejects && chip('rejected', 'Відхилені', summary ? counts.rejected : null)}
          {chip('unrated', 'Без оцінки', summary ? counts.unrated : null)}
        </Stack>
      )}

      {role === 'screener' && (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', px: 2, pt: 1, maxWidth: 420 }}>
          <Typography variant="body2" noWrap>Розмір фото</Typography>
          <Slider size="small" min={90} max={420} step={10} value={rowHeight} onChange={(_e, v) => dispatch(setRowHeight(v as number))} aria-label="Розмір фото" />
        </Stack>
      )}

      <Box sx={{ p: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        {!loading && !error && items.length === 0 && <Alert severity="info">У цій вибірці немає фото.</Alert>}
        {groups.map((g) => {
          const start = offset
          offset += g.items.length
          return (
            <Box key={g.key} sx={{ mb: 1 }}>
              {g.title && <Typography variant="h6" sx={{ mt: 1, mb: 0.5 }}>{g.title}</Typography>}
              <RowsPhotoAlbum
                photos={g.items.map((x) => ({
                  key: x.image.pageId, src: x.image.url ?? '', width: x.image.width, height: x.image.height,
                  alt: x.image.title, item: x,
                  title: `${x.image.title.replace(/^File:/, '')} · ${x.image.width}×${x.image.height}${x.image.author ? ` · ${x.image.author}` : ''}`
                }))}
                targetRowHeight={rowHeight}
                spacing={6}
                defaultContainerWidth={1200}
                render={renderFor(start) as never}
                componentsProps={{ image: { loading: 'lazy' } }}
              />
            </Box>
          )
        })}
        <Box ref={sentinel} sx={{ height: 40, display: 'grid', placeItems: 'center' }}>{loading && <CircularProgress size={24} />}</Box>
      </Box>

      {open !== null && role && (
        <DetailView items={flat} index={open} role={role} scale={scale} roundId={roundId}
          onIndex={setOpen} onClose={() => setOpen(null)} onRate={onRate} />
      )}
    </>
  )
}
