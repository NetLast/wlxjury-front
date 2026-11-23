import { useEffect, useState } from 'react'
import { Typography } from '@mui/material'
import { fetchCommonsInfo, type CommonsInfo as Info } from '../api/commons'

/** Photo year, camera and description from Commons, loaded when a photo is opened. */
export default function CommonsInfo({ title }: { title: string }) {
  const [info, setInfo] = useState<Info | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setInfo(null)
    fetchCommonsInfo(title, ctrl.signal).then(setInfo).catch(() => setInfo({}))
    return () => ctrl.abort()
  }, [title])

  if (!info) return <Typography variant="caption" color="text.secondary">Завантаження інформації…</Typography>
  const line = [info.year && `Рік: ${info.year}`, info.camera && `Камера: ${info.camera}`, info.license].filter(Boolean).join(' · ')
  if (!line && !info.description) return null
  return (
    <Typography variant="caption" color="text.secondary" component="div" sx={{ maxHeight: 64, overflow: 'auto' }}>
      {line}
      {info.description && <div>{info.description}</div>}
    </Typography>
  )
}
