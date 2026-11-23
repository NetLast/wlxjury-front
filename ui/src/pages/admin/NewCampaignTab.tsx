import { useEffect, useState } from 'react'
import { Alert, Box, Button, ImageList, ImageListItem, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { createContest } from '../../api/contests'
import { fetchCategoryThumbs, type CommonsThumb } from '../../api/commons'
import { USE_MOCK } from '../../api/baseQuery'
import FallbackImg from '../../components/FallbackImg'

interface Form { name: string; year: number; country: string; campaign: string; images: string }

/** Creates a campaign; the Commons category is previewed with its first thumbnails as you type. */
export default function NewCampaignTab() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>({ defaultValues: { year: new Date().getFullYear() } })
  const category = watch('images') ?? ''
  const [thumbs, setThumbs] = useState<CommonsThumb[]>([])
  const [previewError, setPreviewError] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!category.trim()) { setThumbs([]); return }
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      setPreviewError(false)
      fetchCategoryThumbs(category, 12, ctrl.signal).then(setThumbs).catch((e) => { if (!ctrl.signal.aborted) { setPreviewError(true); setThumbs([]); void e } })
    }, 400) // debounce: don't query Commons on every keystroke
    return () => { clearTimeout(t); ctrl.abort() }
  }, [category])

  const submit = handleSubmit(async (v) => {
    if (USE_MOCK) { setResult({ ok: true, text: 'Демо-режим: кампанію не збережено.' }); return }
    try {
      await createContest({ name: v.name, year: Number(v.year), country: v.country, campaign: v.campaign || undefined, images: v.images || undefined, greeting: { use: false } })
      setResult({ ok: true, text: 'Кампанію створено.' })
    } catch {
      setResult({ ok: false, text: 'Не вдалося створити кампанію.' })
    }
  })

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 640 }}>
      <Stack spacing={2}>
        <TextField label="Назва" error={!!errors.name} helperText={errors.name?.message} {...register('name', { required: 'Вкажіть назву' })} />
        <Stack direction="row" spacing={2}>
          <TextField label="Рік" type="number" {...register('year', { required: true, valueAsNumber: true })} />
          <TextField label="Країна" fullWidth error={!!errors.country} helperText={errors.country?.message} {...register('country', { required: 'Вкажіть країну' })} />
        </Stack>
        <TextField label="Кампанія (код)" {...register('campaign')} />
        <TextField label="Категорія на Commons" placeholder="Images from Wiki Loves Earth 2024 in Ukraine" {...register('images')} />

        {category.trim() && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Попередній перегляд категорії</Typography>
            {previewError && <Alert severity="warning">Не вдалося отримати файли категорії з Commons.</Alert>}
            {!previewError && thumbs.length === 0 && <Typography variant="body2" color="text.secondary">Файлів не знайдено (поки що).</Typography>}
            <ImageList cols={4} gap={6}>
              {thumbs.map((t) => (
                <ImageListItem key={t.title}><FallbackImg src={t.thumbUrl} alt={t.title} loading="lazy" /></ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}

        {result && <Alert severity={result.ok ? 'success' : 'error'}>{result.text}</Alert>}
        <Box><Button type="submit" variant="contained">Створити кампанію</Button></Box>
      </Stack>
    </Box>
  )
}
