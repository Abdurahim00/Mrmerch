import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { Template, CreateTemplateData, UpdateTemplateData } from "@/lib/models/Template"

// Async thunks
export const fetchTemplates = createAsyncThunk(
  "templates/fetchTemplates",
  async () => {
    const response = await fetch("/api/templates")
    if (!response.ok) {
      throw new Error("Failed to fetch templates")
    }
    return response.json()
  }
)

export const createTemplate = createAsyncThunk(
  "templates/createTemplate",
  async (templateData: CreateTemplateData) => {
    const response = await fetch("/api/templates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(templateData),
    })
    if (!response.ok) {
      throw new Error("Failed to create template")
    }
    return response.json()
  }
)

export const updateTemplate = createAsyncThunk(
  "templates/updateTemplate",
  async (templateData: UpdateTemplateData) => {
    const response = await fetch(`/api/templates/${templateData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(templateData),
    })
    if (!response.ok) {
      throw new Error("Failed to update template")
    }
    return response.json()
  }
)

export const deleteTemplate = createAsyncThunk(
  "templates/deleteTemplate",
  async (id: string) => {
    const response = await fetch(`/api/templates/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Failed to delete template")
    }
    return id
  }
)

interface TemplatesState {
  items: Template[]
  loading: boolean
  error: string | null
  searchTerm: string
  selectedCategory: string
  categories: string[]
}

const initialState: TemplatesState = {
  items: [],
  loading: false,
  error: null,
  searchTerm: "",
  selectedCategory: "All",
  categories: ["All", "Business", "Abstract", "Outdoor", "Text", "Sports", "Music", "Art", "Technology"],
}

const templatesSlice = createSlice({
  name: "templates",
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch templates
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch templates"
      })

    // Create template
    builder
      .addCase(createTemplate.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.loading = false
        state.items.push(action.payload)
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to create template"
      })

    // Update template
    builder
      .addCase(updateTemplate.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.loading = false
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to update template"
      })

    // Delete template
    builder
      .addCase(deleteTemplate.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.filter((item) => item.id !== action.payload)
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to delete template"
      })
  },
})

export const { setSearchTerm, setSelectedCategory, clearError } = templatesSlice.actions
export default templatesSlice.reducer 