import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { Design } from "@/lib/models/Design"

// Async thunks for database operations
export const fetchDesignProducts = createAsyncThunk(
  "designProducts/fetchDesignProducts",
  async () => {
    const response = await fetch("/api/design-products")
    if (!response.ok) {
      throw new Error("Failed to fetch design products")
    }
    return response.json()
  }
)

export const createDesignProduct = createAsyncThunk(
  "designProducts/createDesignProduct",
  async (productData: Omit<Design, "id" | "createdAt" | "updatedAt">) => {
    const response = await fetch("/api/design-products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    })
    if (!response.ok) {
      throw new Error("Failed to create design product")
    }
    return response.json()
  }
)

const initialState = {
  products: [] as Design[],
  loading: false,
  error: null as string | null,
}

const productsSlice = createSlice({
  name: "designProducts",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload
    },
    addProduct: (state, action) => {
      state.products.push(action.payload)
    },
    updateProduct: (state, action) => {
      const index = state.products.findIndex((p) => p.id === action.payload.id)
      if (index !== -1) {
        state.products[index] = action.payload
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch design products
      .addCase(fetchDesignProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDesignProducts.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload
      })
      .addCase(fetchDesignProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch design products"
      })
      // Create design product
      .addCase(createDesignProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createDesignProduct.fulfilled, (state, action) => {
        state.loading = false
        state.products.push(action.payload)
      })
      .addCase(createDesignProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to create design product"
      })
  },
})

export const { 
  setProducts, 
  addProduct, 
  updateProduct, 
  setLoading, 
  setError, 
  clearError 
} = productsSlice.actions

export default productsSlice.reducer
