import { Box, Button, List, ListItem, ListItemText, TextField } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useAddCommentMutation, useCommentsQuery } from '../api/api'

export default function Comments({ roundId, pageId }: { roundId: string; pageId: string }) {
  const { data = [] } = useCommentsQuery({ roundId, imagePageId: pageId })
  const [addComment, { isLoading }] = useAddCommentMutation()
  const { register, handleSubmit, reset } = useForm<{ body: string }>()

  const submit = handleSubmit(async ({ body }) => {
    if (!body.trim()) return
    await addComment({ roundId, imagePageId: pageId, body: body.trim() }).unwrap()
    reset()
  })

  return (
    <Box>
      <List dense disablePadding sx={{ maxHeight: 140, overflow: 'auto' }}>
        {data.map((c) => (
          <ListItem key={c.id} disableGutters>
            <ListItemText primary={c.body} secondary={`${c.username} · ${c.createdAt.slice(0, 16).replace('T', ' ')}`} />
          </ListItem>
        ))}
      </List>
      <Box component="form" onSubmit={submit} sx={{ display: 'flex', gap: 1, mt: 1 }}>
        {/* the viewer's hotkeys must not fire while typing */}
        <TextField size="small" fullWidth placeholder="Коментар" {...register('body')} onKeyDown={(e) => e.stopPropagation()} />
        <Button type="submit" variant="contained" disabled={isLoading}>Ок</Button>
      </Box>
    </Box>
  )
}
