import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { Design } from "@/types"

interface DesignsState {
  items: Design[]
  loading: boolean
  error: string | null
}

const initialState: DesignsState = {
  items: [],
  loading: false,
  error: null,
}

export const fetchDesigns = createAsyncThunk("designs/fetchDesigns", async (userId: string) => {
  const response = await fetch(`/api/designs?userId=${userId}`)
  if (!response.ok) {
    throw new Error("Failed to fetch designs")
  }
  return response.json()
})

export const createDesign = createAsyncThunk(
  "designs/createDesign",
  async (design: Omit<Design, "id" | "createdAt" | "updatedAt">) => {
    const response = await fetch("/api/designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(design),
    })
    if (!response.ok) {
      throw new Error("Failed to create design")
    }
    return response.json()
  },
)

export const updateDesign = createAsyncThunk("designs/updateDesign", async (design: Design) => {
  const response = await fetch(`/api/designs/${design.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(design),
  })
  if (!response.ok) {
    throw new Error("Failed to update design")
  }
  return response.json()
})

export const deleteDesign = createAsyncThunk("designs/deleteDesign", async (id: string) => {
  const response = await fetch(`/api/designs/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to delete design")
  }
  return id
})

const designsSlice = createSlice({
  name: "designs",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDesigns.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDesigns.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchDesigns.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch designs"
      })
      .addCase(createDesign.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createDesign.fulfilled, (state, action) => {
        state.loading = false
        state.items.push(action.payload)
      })
      .addCase(createDesign.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to create design"
      })
      .addCase(updateDesign.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateDesign.fulfilled, (state, action) => {
        state.loading = false
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
      .addCase(updateDesign.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to update design"
      })
      .addCase(deleteDesign.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteDesign.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.filter((item) => item.id !== action.payload)
      })
      .addCase(deleteDesign.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to delete design"
      })
  },
})

export const { clearError } = designsSlice.actions
export default designsSlice.reducer
