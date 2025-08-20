import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import type { Category, Subcategory } from "@/types"

interface CategoriesState {
  categories: Category[]
  subcategories: Subcategory[]
  loading: boolean
  error: string | null
}

const initialState: CategoriesState = {
  categories: [],
  subcategories: [],
  loading: false,
  error: null,
}

export const fetchCategories = createAsyncThunk("categories/fetchCategories", async () => {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("Failed to fetch categories")
  return res.json()
})

export const createCategory = createAsyncThunk("categories/createCategory", async (data: Omit<Category, "id">) => {
  const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create category")
  return res.json()
})

export const updateCategory = createAsyncThunk("categories/updateCategory", async (data: Partial<Category> & { id: string }) => {
  const res = await fetch(`/api/categories/${data.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update category")
  return res.json()
})

export const deleteCategory = createAsyncThunk("categories/deleteCategory", async (id: string) => {
  const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete category")
  return id
})

export const fetchSubcategories = createAsyncThunk("categories/fetchSubcategories", async (categoryId?: string) => {
  const url = categoryId ? `/api/subcategories?categoryId=${categoryId}` : "/api/subcategories"
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch subcategories")
  return res.json()
})

export const createSubcategory = createAsyncThunk("categories/createSubcategory", async (data: Omit<Subcategory, "id">) => {
  const res = await fetch("/api/subcategories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create subcategory")
  return res.json()
})

export const updateSubcategory = createAsyncThunk("categories/updateSubcategory", async (data: Partial<Subcategory> & { id: string }) => {
  const res = await fetch(`/api/subcategories/${data.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update subcategory")
  return res.json()
})

export const deleteSubcategory = createAsyncThunk("categories/deleteSubcategory", async (id: string) => {
  const res = await fetch(`/api/subcategories/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete subcategory")
  return id
})

const slice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchCategories.fulfilled, (s, a) => { s.loading = false; s.categories = a.payload })
      .addCase(fetchCategories.rejected, (s, a) => { s.loading = false; s.error = a.error.message || null })

      .addCase(createCategory.fulfilled, (s, a) => { s.categories.unshift(a.payload) })
      .addCase(updateCategory.fulfilled, (s, a) => {
        const i = s.categories.findIndex((c) => c.id === a.payload.id)
        if (i !== -1) s.categories[i] = a.payload
      })
      .addCase(deleteCategory.fulfilled, (s, a) => { s.categories = s.categories.filter((c) => c.id !== a.payload) })

      .addCase(fetchSubcategories.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchSubcategories.fulfilled, (s, a) => { s.loading = false; s.subcategories = a.payload })
      .addCase(fetchSubcategories.rejected, (s, a) => { s.loading = false; s.error = a.error.message || null })

      .addCase(createSubcategory.fulfilled, (s, a) => { s.subcategories.unshift(a.payload) })
      .addCase(updateSubcategory.fulfilled, (s, a) => {
        const i = s.subcategories.findIndex((c) => c.id === a.payload.id)
        if (i !== -1) s.subcategories[i] = a.payload
      })
      .addCase(deleteSubcategory.fulfilled, (s, a) => { s.subcategories = s.subcategories.filter((c) => c.id !== a.payload) })
  }
})

export default slice.reducer

