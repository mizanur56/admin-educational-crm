import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthSession, AuthUser } from '@/types'

type AuthState = {
  session: AuthSession | null
  hydrated: boolean
}

type AuthRoot = { auth: AuthState }

const initialState: AuthState = {
  session: null,
  hydrated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthSession>) => {
      state.session = action.payload
      state.hydrated = true
    },
    patchUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.session) {
        state.session.user = { ...state.session.user, ...action.payload }
      }
    },
    clearSession: (state) => {
      state.session = null
      state.hydrated = true
    },
    setHydrated: (state, action: PayloadAction<boolean>) => {
      state.hydrated = action.payload
    },
  },
})

export const { setSession, patchUser, clearSession, setHydrated } = authSlice.actions
export default authSlice.reducer

export const selectAuthSession = (state: AuthRoot) => state.auth.session
export const selectCurrentUser = (state: AuthRoot) => state.auth.session?.user ?? null
export const selectAuthHydrated = (state: AuthRoot) => state.auth.hydrated

const EMPTY_PERMISSIONS: string[] = []
export const selectPermissions = (state: AuthRoot) => state.auth.session?.permissions ?? EMPTY_PERMISSIONS
