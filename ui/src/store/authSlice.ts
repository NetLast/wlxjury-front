import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
}

const KEY = 'wlxjury.auth'

function load(): AuthState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as AuthState
  } catch {
    /* storage unavailable or corrupted: start signed out */
  }
  return { token: null, user: null }
}

const slice = createSlice({
  name: 'auth',
  initialState: load(),
  reducers: {
    signedIn(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token
      state.user = action.payload.user
      try {
        localStorage.setItem(KEY, JSON.stringify(state))
      } catch {
        /* ignore */
      }
    },
    signedOut(state) {
      state.token = null
      state.user = null
      try {
        localStorage.removeItem(KEY)
      } catch {
        /* ignore */
      }
    }
  }
})

export const { signedIn, signedOut } = slice.actions
export default slice.reducer
