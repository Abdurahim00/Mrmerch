import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { User } from "@/types"

interface UsersState {
  items: User[]
  loading: boolean
  error: string | null
}

const initialState: UsersState = {
  items: [],
  loading: false,
  error: null,
}

export const fetchUsers = createAsyncThunk("users/fetchUsers", async () => {
  const response = await fetch("/api/users")
  if (!response.ok) {
    throw new Error("Failed to fetch users")
  }
  return response.json()
})

export const updateUser = createAsyncThunk("users/updateUser", async (user: User) => {
  const response = await fetch(`/api/users/${user.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  })
  if (!response.ok) {
    throw new Error("Failed to update user")
  }
  return response.json()
})

export const deleteUser = createAsyncThunk("users/deleteUser", async (id: string) => {
  const response = await fetch(`/api/users/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to delete user")
  }
  return id
})

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch users"
      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to update user"
      })
      .addCase(deleteUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.filter((item) => item.id !== action.payload)
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to delete user"
      })
  },
})

export const { clearError } = usersSlice.actions
export default usersSlice.reducer
