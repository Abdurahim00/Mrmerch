import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "@/types"

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSessionUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
      state.loading = false
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const { setSessionUser, clearError } = authSlice.actions
export default authSlice.reducer
