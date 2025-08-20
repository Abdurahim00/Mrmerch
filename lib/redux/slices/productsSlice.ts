import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { Product } from "@/lib/models/Product"
import type { PaginationParams, PaginatedResult } from "@/lib/services/productService"

// Async thunks for database operations
export const fetchProductsPaginated = createAsyncThunk(
  "products/fetchProductsPaginated",
  async (params: PaginationParams) => {
    const searchParams = new URLSearchParams()
    searchParams.append('page', params.page.toString())
    searchParams.append('limit', params.limit.toString())
    if (params.search) searchParams.append('search', params.search)
    if (params.categoryId) searchParams.append('categoryId', params.categoryId)
    
    const response = await fetch(`/api/products?${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error("Failed to fetch products")
    }
    return response.json() as Promise<PaginatedResult<Product>>
  }
)

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async () => {
    // For backward compatibility, fetch all products with a large limit
    const response = await fetch("/api/products?page=1&limit=1000")
    if (!response.ok) {
      throw new Error("Failed to fetch products")
    }
    const result = await response.json()
    
    console.log('🔍 [fetchProducts] API response:', {
      hasData: !!result.data,
      dataLength: result.data?.length,
      hasPagination: !!result.pagination,
      resultKeys: Object.keys(result)
    })
    
    // The new API returns { data: Product[], pagination: {...} }
    // For backward compatibility, return just the data array
    if (result.data && Array.isArray(result.data)) {
      return result.data
    }
    
    // Fallback: if no data property, return the result as-is (for backward compatibility)
    console.warn('⚠️ [fetchProducts] No data property found, returning result as-is')
    return result
  }
)

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    })
    if (!response.ok) {
      throw new Error("Failed to create product")
    }
    return response.json()
  }
)

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async (productData: Product) => {
    const { id, ...update } = productData as any
    const response = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(update),
    })
    if (!response.ok) {
      throw new Error("Failed to update product")
    }
    return response.json()
  }
)

export const deleteProduct = createAsyncThunk("products/deleteProduct", async (id: string) => {
  const response = await fetch(`/api/products/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to delete product")
  }
  return id
})

const initialState = {
  items: [] as Product[],
  loading: false,
  error: null as string | null,
  // Pagination state
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  },
  // Search and filter state
  searchTerm: '',
  selectedCategory: 'all',
  // Cache for previous pages
  pageCache: {} as Record<number, Product[]>
}

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.items = action.payload
    },
    addProduct: (state, action) => {
      state.items.push(action.payload)
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
    // Pagination actions
    setPage: (state, action) => {
      state.pagination.page = action.payload
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload
      // Reset to first page when searching
      state.pagination.page = 1
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload
      // Reset to first page when changing category
      state.pagination.page = 1
    },
    clearPageCache: (state) => {
      state.pageCache = {}
    },
    // Cache management
    cachePage: (state, action) => {
      const { page, products } = action.payload
      state.pageCache[page] = products
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch products paginated
      .addCase(fetchProductsPaginated.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProductsPaginated.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.pagination = action.payload.pagination
        // Cache the current page
        state.pageCache[action.payload.pagination.page] = action.payload.data
      })
      .addCase(fetchProductsPaginated.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch products"
      })
      // Fetch products (legacy)
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        
        console.log('✅ [fetchProducts.fulfilled] Products loaded:', {
          productsCount: action.payload?.length,
          isArray: Array.isArray(action.payload),
          firstProduct: action.payload?.[0]?.name,
          stateItemsCount: state.items.length
        })
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch products"
      })
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false
        state.items.push(action.payload)
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to create product"
      })
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false
        const index = state.items.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to update product"
      })
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.filter((item) => item.id !== action.payload)
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to delete product"
      })
  },
})

export const { 
  setProducts, 
  addProduct, 
  setLoading, 
  setError, 
  clearError,
  // Pagination actions
  setPage,
  setSearchTerm,
  setSelectedCategory,
  clearPageCache,
  // Cache management
  cachePage
} = productsSlice.actions

export default productsSlice.reducer
