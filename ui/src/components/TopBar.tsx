import { AppBar, Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/api'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { signedOut } from '../store/authSlice'

/** Title ("campaign – year") on the left, the page's icon buttons, then logout. */
export default function TopBar({ title, children }: { title: string; children?: ReactNode }) {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const logout = () => {
    dispatch(signedOut())
    dispatch(api.util.resetApiState())
    navigate('/login')
  }

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar variant="dense" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
        <Typography variant="h6" noWrap sx={{ flexShrink: 1, minWidth: 0 }}>{title}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        {children}
        <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' }, mx: 1 }}>{user?.fullname}</Typography>
        <Tooltip title="Вийти">
          <IconButton onClick={logout} aria-label="Вийти"><LogoutIcon /></IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}
