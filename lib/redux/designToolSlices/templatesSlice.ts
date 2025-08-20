import { createSlice } from "@reduxjs/toolkit"

const sampleTemplates = [
  {
    id: "logo-vintage",
    name: "Vintage Logo",
    category: "Business",
    image: "/placeholder.svg?height=200&width=200&text=Vintage+Logo",
    type: "image",
  },
  {
    id: "modern-art",
    name: "Modern Abstract",
    category: "Abstract",
    image: "/placeholder.svg?height=200&width=200&text=Modern+Art",
    type: "image",
  },
  {
    id: "nature-design",
    name: "Nature Elements",
    category: "Outdoor",
    image: "/placeholder.svg?height=200&width=200&text=Nature+Design",
    type: "image",
  },
  {
    id: "geometric-pattern",
    name: "Geometric Pattern",
    category: "Abstract",
    image: "/placeholder.svg?height=200&width=200&text=Geometric",
    type: "image",
  },
  {
    id: "typography-art",
    name: "Typography Art",
    category: "Text",
    image: "/placeholder.svg?height=200&width=200&text=Typography",
    type: "text",
  },
  {
    id: "minimalist-icon",
    name: "Minimalist Icon",
    category: "Business",
    image: "/placeholder.svg?height=200&width=200&text=Minimal+Icon",
    type: "image",
  },
  {
    id: "sports-logo",
    name: "Sports Logo",
    category: "Sports",
    image: "/placeholder.svg?height=200&width=200&text=Sports+Logo",
    type: "image",
  },
  {
    id: "music-note",
    name: "Music Notes",
    category: "Music",
    image: "/placeholder.svg?height=200&width=200&text=Music+Notes",
    type: "image",
  },
]

const initialState = {
  templates: sampleTemplates,
  categories: ["All", "Business", "Abstract", "Outdoor", "Text", "Sports", "Music"],
  selectedCategory: "All",
  searchTerm: "",
  loading: false,
  error: null,
}

const templatesSlice = createSlice({
  name: "templates",
  initialState,
  reducers: {
    setTemplates: (state, action) => {
      state.templates = action.payload
    },
    addTemplate: (state, action) => {
      state.templates.push(action.payload)
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
  },
})

export const { setTemplates, addTemplate, setSelectedCategory, setSearchTerm, setLoading, setError } =
  templatesSlice.actions

export default templatesSlice.reducer
