import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { homePath, roleOf } from './auth/roles'
import AdminPage from './pages/AdminPage'
import GalleryPage from './pages/GalleryPage'
import LoginPage from './pages/LoginPage'
import RoundsPage from './pages/RoundsPage'
import StatsPage from './pages/StatsPage'
import { useAppSelector } from './store/hooks'
import { store } from './store/store'
import type { Role } from './types'

const theme = createTheme()

function Guard({ allow, children }: { allow: Role[]; children: ReactElement }) {
  const user = useAppSelector((s) => s.auth.user)
  const role = roleOf(user)
  if (!role) return <Navigate to="/login" replace />
  if (!allow.includes(role)) return <Navigate to={homePath(role)} replace />
  return children
}

function Home() {
  const user = useAppSelector((s) => s.auth.user)
  return <Navigate to={homePath(roleOf(user))} replace />
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* basename: the production build is served by Play at /ui */}
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<Guard allow={['admin']}><AdminPage /></Guard>} />
            <Route path="/admin/rounds/:roundId/stats" element={<Guard allow={['admin']}><StatsPage /></Guard>} />
            <Route path="/rounds" element={<Guard allow={['jury', 'screener']}><RoundsPage /></Guard>} />
            <Route path="/rounds/:roundId" element={<Guard allow={['admin', 'jury', 'screener']}><GalleryPage /></Guard>} />
            <Route path="*" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  )
}
