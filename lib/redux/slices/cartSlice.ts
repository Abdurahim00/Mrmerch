import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { CartItem, Product, CartItemSize } from "@/types"

interface CartState {
  items: CartItem[]
}

// Helper function to load cart from localStorage
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') {
    return []
  }
  
  try {
    const savedCart = localStorage.getItem('cart')
    return savedCart ? JSON.parse(savedCart) : []
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error)
    return []
  }
}

// Helper function to save cart to localStorage
const saveCartToStorage = (items: CartItem[]) => {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    localStorage.setItem('cart', JSON.stringify(items))
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error)
  }
}

const initialState: CartState = {
  items: loadCartFromStorage(),
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Replace entire cart (e.g., after merge/hydrate)
    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload
      saveCartToStorage(state.items)
    },
    // Standard add to cart (legacy)
    addToCart: (state, action: PayloadAction<Product>) => {
      const baseId = action.payload.id
      // Find an existing cart item with same base product and no design/context
      const existingItem = state.items.find((item) => {
        const sameBase = (item.productId || item.id) === baseId
        const hasNoDesign = !item.designId && !item.designPreview && !item.selectedSizes
        return sameBase && hasNoDesign
      })
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        state.items.push({ ...action.payload, quantity: 1, productId: baseId })
      }
      // Save to localStorage
      saveCartToStorage(state.items)
    },
    
    // Add to cart with size information
    addToCartWithSizes: (state, action: PayloadAction<{
      product: Product, 
      selectedSizes: CartItemSize[],
      designPreview?: string,
      designId?: string,
      designContext?: any,
      designCanvasJSON?: any
    }>) => {
      const { product, selectedSizes, designPreview, designId, designContext, designCanvasJSON } = action.payload
      
      // Log the data being added to cart
      console.log('🛒 [CartSlice] Adding to cart with sizes:', {
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          hasVariations: (product as any).hasVariations,
          type: typeof product.price
        },
        selectedSizes: selectedSizes.map(size => ({
          size: size.size,
          quantity: size.quantity,
          price: size.price,
          totalPrice: size.price * size.quantity
        })),
        designPreview: designPreview ? 'Present' : 'None',
        designId: designId || 'None',
        designContext: designContext ? {
          viewMode: designContext.viewMode,
          productColor: designContext.productColor,
          hasTemplate: !!designContext.selectedTemplate,
          hasDesignCosts: !!designContext.designCosts,
          allDesignedAngles: designContext.allDesignedAngles ? {
            count: designContext.allDesignedAngles.length,
            angles: designContext.allDesignedAngles.map((angle: any) => ({
              angle: angle.angle,
              hasDesign: angle.hasDesign,
              hasCanvasData: !!angle.canvasJSON
            }))
          } : 'Missing'
        } : 'None',
        designCanvasJSON: designCanvasJSON ? 'Present' : 'None'
      })
      
      // Generate a unique ID for this specific product + design combination
      const uniqueId = designId 
        ? `${product.id}-${designId}` 
        : `${product.id}-${Date.now()}`
      
      // Calculate total quantity across all sizes
      const totalQuantity = selectedSizes.reduce((sum, size) => sum + size.quantity, 0)
      
      // Create cart item with size information
      const newItem: CartItem = {
        ...product,
        id: uniqueId,
        productId: product.id,
        quantity: totalQuantity,
        selectedSizes,
        designPreview,
        designId,
        designContext,
        designCanvasJSON
      }
      
      console.log('🛒 [CartSlice] Created cart item:', {
        uniqueId,
        totalQuantity,
        finalItem: {
          id: newItem.id,
          name: newItem.name,
          price: newItem.price,
          quantity: newItem.quantity,
          selectedSizesCount: newItem.selectedSizes?.length || 0,
          hasDesignPreview: !!newItem.designPreview,
          hasDesignContext: !!newItem.designContext,
          designContextDetails: newItem.designContext ? {
            viewMode: newItem.designContext.viewMode,
            productColor: newItem.designContext.productColor,
            allDesignedAnglesCount: (newItem.designContext as any).allDesignedAngles?.length || 0,
            allDesignedAngles: (newItem.designContext as any).allDesignedAngles?.map((angle: any) => ({
              angle: angle.angle,
              hasDesign: angle.hasDesign,
              hasCanvasData: !!angle.canvasJSON
            })) || []
          } : 'None'
        }
      })
      
      state.items.push(newItem)
      
      // Save to localStorage
      saveCartToStorage(state.items)
    },

    // Add to cart carrying design data without sizes (defaults to quantity 1)
    addToCartWithDesign: (state, action: PayloadAction<{
      product: Product,
      quantity?: number,
      designPreview?: string,
      designId?: string,
      designContext?: any,
      designCanvasJSON?: any
    }>) => {
      const { product, quantity = 1, designPreview, designId, designContext, designCanvasJSON } = action.payload

      // Unique composite id per product+design
      const uniqueId = designId ? `${product.id}-${designId}` : `${product.id}-${Date.now()}`

      const newItem: CartItem = {
        ...product,
        id: uniqueId,
        productId: product.id,
        quantity,
        designPreview,
        designId,
        designContext,
        designCanvasJSON,
      }

      state.items.push(newItem)
      saveCartToStorage(state.items)
    },
    
    // Update quantity for standard cart items
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload
      if (quantity <= 0) {
        state.items = state.items.filter((item) => item.id !== id)
      } else {
        const item = state.items.find((item) => item.id === id)
        if (item) {
          item.quantity = quantity
        }
      }
      // Save to localStorage
      saveCartToStorage(state.items)
    },
    
    // Update size quantities for a cart item
    updateSizeQuantities: (state, action: PayloadAction<{ 
      id: string; 
      selectedSizes: CartItemSize[] 
    }>) => {
      const { id, selectedSizes } = action.payload
      const item = state.items.find((item) => item.id === id)
      
      if (item) {
        // Update the selected sizes
        item.selectedSizes = selectedSizes
        
        // Recalculate total quantity
        item.quantity = selectedSizes.reduce((sum, size) => sum + size.quantity, 0)
        
        // Remove item if all sizes have 0 quantity
        if (item.quantity <= 0) {
          state.items = state.items.filter((i) => i.id !== id)
        }
      }
      // Save to localStorage
      saveCartToStorage(state.items)
    },
    
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
      // Save to localStorage
      saveCartToStorage(state.items)
    },
    
    clearCart: (state) => {
      state.items = []
      // Save to localStorage
      saveCartToStorage(state.items)
    },
  },
})

export const { 
  setCart, 
  addToCart, 
  addToCartWithSizes,
  addToCartWithDesign,
  updateQuantity, 
  updateSizeQuantities,
  removeFromCart, 
  clearCart 
} = cartSlice.actions
export default cartSlice.reducer
