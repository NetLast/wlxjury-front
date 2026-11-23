import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLoginMutation } from '../api/api'
import { USE_MOCK } from '../api/baseQuery'
import { homePath, roleOf } from '../auth/roles'
import { signedIn } from '../store/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

interface Form { email: string; password: string }

export default function LoginPage() {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [login, { isLoading, error }] = useLoginMutation()
  const { register, handleSubmit, formState: { errors } } = useForm<Form>()

  if (user) return <Navigate to={homePath(roleOf(user))} replace />

  const submit = handleSubmit(async (values) => {
    const res = await login(values).unwrap().catch(() => null)
    if (res) {
      dispatch(signedIn(res))
      navigate(homePath(roleOf(res.user)), { replace: true })
    }
  })

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper component="form" onSubmit={submit} sx={{ p: 3, width: '100%', maxWidth: 380 }}>
        <Stack spacing={2}>
          <Typography variant="h5">WLX Jury</Typography>
          {USE_MOCK && (
            <Alert severity="info">
              Демо-режим. admin@example.org / admin, jury@example.org / jury, screener@example.org / screener
            </Alert>
          )}
          <TextField label="Email" type="email" autoComplete="username"
            error={!!errors.email} helperText={errors.email?.message}
            {...register('email', { required: 'Вкажіть email' })} />
          <TextField label="Пароль" type="password" autoComplete="current-password"
            error={!!errors.password} helperText={errors.password?.message}
            {...register('password', { required: 'Вкажіть пароль' })} />
          {error && <Alert severity="error">{'message' in error ? error.message : 'Помилка входу'}</Alert>}
          <Button type="submit" variant="contained" disabled={isLoading}>Увійти</Button>
        </Stack>
      </Paper>
    </Box>
  )
}
