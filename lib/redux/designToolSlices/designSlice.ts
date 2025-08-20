import { createSlice } from "@reduxjs/toolkit"

// Define types for our state
interface ImageLayer {
  id: string;
  src: string;
  type: 'template' | 'upload';
  name: string;
}

// New interface for variation-specific design persistence
interface VariationDesign {
  variationId: string;
  viewMode: string;
  canvasJSON: any;
  lastModified: number;
  isShared: boolean; // Track if this design was shared from another variation
}

interface DesignState {
  selectedTool: string;
  viewMode: string;
  selectedProduct: any | null;
  productColor: string;
  selectedTemplate: any | null;
  imageLayers: ImageLayer[];
  showProductModal: boolean;
  showTemplateModal: boolean;
  isLoading: boolean;
  error: string | null;
  // New fields for variation design persistence
  variationDesigns: VariationDesign[];
  currentDesignId: string | null;
  autoSaveEnabled: boolean;
}

const initialState: DesignState = {
  selectedTool: "product",
  viewMode: "front",
  selectedProduct: null,
  productColor: "",
  selectedTemplate: null,
  imageLayers: [], // { id, src, type: 'template' | 'upload', name }
  showProductModal: false,
  showTemplateModal: false,
  isLoading: false,
  error: null,
  // New fields initialization
  variationDesigns: [],
  currentDesignId: null,
  autoSaveEnabled: true,
}

const designSlice = createSlice({
  name: "design",
  initialState,
  reducers: {
    setSelectedTool: (state, action) => {
      state.selectedTool = action.payload
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload
    },
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload
      // Only set product color if a product is selected
      if (action.payload) {
        // Set the initial color from the product's baseColor
        state.productColor = action.payload.baseColor || ""
        
        // Log the product data for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 [DesignSlice] setSelectedProduct:', {
            product: action.payload,
            baseColor: action.payload.baseColor,
            hasVariations: action.payload.hasVariations,
            variationsCount: action.payload.variations?.length,
            variations: action.payload.variations?.map((v: any) => ({
              color: v.color?.hex_code,
              imagesCount: v.images?.length
            }))
          })
        }
      } else {
        state.productColor = ""
      }
    },
    setProductColor: (state, action) => {
      state.productColor = action.payload
    },
    setSelectedTemplate: (state, action) => {
      state.selectedTemplate = action.payload
      // Optionally add to imageLayers for rendering
      if (action.payload) {
        state.imageLayers.push({
          id: `template_${action.payload.id}`,
          src: action.payload.image,
          type: "template",
          name: action.payload.name,
        })
      }
    },
    addImageLayer: (state, action) => {
      state.imageLayers.push(action.payload)
    },
    setShowProductModal: (state, action) => {
      console.log('🔄 [DesignSlice] setShowProductModal:', { current: state.showProductModal, new: action.payload })
      state.showProductModal = action.payload
    },
    setShowTemplateModal: (state, action) => {
      console.log('🔄 [DesignSlice] setShowTemplateModal:', { current: state.showTemplateModal, new: action.payload })
      state.showTemplateModal = action.payload
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    // New reducers for variation design persistence
    saveVariationDesign: (state, action) => {
      const { variationId, viewMode, canvasJSON, isShared = false } = action.payload
      
      // Find existing design for this variation+view combination
      const existingIndex = state.variationDesigns.findIndex(
        design => design.variationId === variationId && design.viewMode === viewMode
      )
      
      const designData: VariationDesign = {
        variationId,
        viewMode,
        canvasJSON,
        lastModified: Date.now(),
        isShared
      }
      
      if (existingIndex !== -1) {
        // Update existing design
        state.variationDesigns[existingIndex] = designData
      } else {
        // Add new design
        state.variationDesigns.push(designData)
      }
      
      // Set current design ID
      state.currentDesignId = `${variationId}:${viewMode}`
      
      console.log('💾 [DesignSlice] Saved variation design:', {
        variationId,
        viewMode,
        isShared,
        totalDesigns: state.variationDesigns.length
      })
    },
    loadVariationDesign: (state, action) => {
      const { variationId, viewMode } = action.payload
      const design = state.variationDesigns.find(
        d => d.variationId === variationId && d.viewMode === viewMode
      )
      
      if (design) {
        state.currentDesignId = `${variationId}:${viewMode}`
        console.log('📂 [DesignSlice] Loaded variation design:', {
          variationId,
          viewMode,
          isShared: design.isShared,
          lastModified: design.lastModified
        })
      } else {
        state.currentDesignId = null
        console.log('📂 [DesignSlice] No design found for:', { variationId, viewMode })
      }
    },
    shareDesignAcrossVariations: (state, action) => {
      const { sourceVariationId, viewMode, canvasJSON, targetVariationIds } = action.payload
      
      targetVariationIds.forEach((targetVariationId: string) => {
        // Skip if target variation already has a design for this view
        const existingDesign = state.variationDesigns.find(
          d => d.variationId === targetVariationId && d.viewMode === viewMode
        )
        
        if (!existingDesign) {
          // Share the design to this variation
          const sharedDesign: VariationDesign = {
            variationId: targetVariationId,
            viewMode,
            canvasJSON,
            lastModified: Date.now(),
            isShared: true
          }
          
          state.variationDesigns.push(sharedDesign)
          
          console.log('🔄 [DesignSlice] Shared design to variation:', {
            from: sourceVariationId,
            to: targetVariationId,
            viewMode,
            isInitialShare: action.payload.isInitialShare || false
          })
        } else {
          console.log('🔄 [DesignSlice] Skipped sharing to variation (already has design):', {
            variationId: targetVariationId,
            viewMode,
            existingDesignLastModified: existingDesign.lastModified
          })
        }
      })
    },
    clearVariationDesign: (state, action) => {
      const { variationId, viewMode } = action.payload
      state.variationDesigns = state.variationDesigns.filter(
        design => !(design.variationId === variationId && design.viewMode === viewMode)
      )
      
      if (state.currentDesignId === `${variationId}:${viewMode}`) {
        state.currentDesignId = null
      }
      
      console.log('🗑️ [DesignSlice] Cleared variation design:', { variationId, viewMode })
    },
    setAutoSaveEnabled: (state, action) => {
      state.autoSaveEnabled = action.payload
    },
    clearAllDesigns: (state) => {
      state.variationDesigns = []
      state.currentDesignId = null
      console.log('🗑️ [DesignSlice] Cleared all designs')
    }
  },
})

export const {
  setSelectedTool,
  setViewMode,
  setSelectedProduct,
  setProductColor,
  setSelectedTemplate,
  addImageLayer,
  setShowProductModal,
  setShowTemplateModal,
  setLoading,
  setError,
  // New actions
  saveVariationDesign,
  loadVariationDesign,
  shareDesignAcrossVariations,
  clearVariationDesign,
  setAutoSaveEnabled,
  clearAllDesigns,
} = designSlice.actions

export default designSlice.reducer
    