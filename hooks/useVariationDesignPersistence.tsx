import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/lib/redux/store'
import { 
  saveVariationDesign, 
  loadVariationDesign, 
  shareDesignAcrossVariations,
  clearVariationDesign 
} from '@/lib/redux/designToolSlices/designSlice'

interface UseVariationDesignPersistenceProps {
  fabricCanvas: any
  selectedProduct: any
  productColor: string
  viewMode: string
  autoSaveDelay?: number
}

const STORAGE_KEY = 'variationDesigns'

export const useVariationDesignPersistence = ({
  fabricCanvas,
  selectedProduct,
  productColor,
  viewMode,
  autoSaveDelay = 1000
}: UseVariationDesignPersistenceProps) => {
  const dispatch = useDispatch()
  const { variationDesigns, autoSaveEnabled } = useSelector((state: RootState) => state.design)
  
  // Refs for debouncing
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastCanvasStateRef = useRef<string>('')
  
  // Get current variation ID based on product color
  const getCurrentVariationId = useCallback(() => {
    if (!selectedProduct) return null
    
    if (selectedProduct.hasVariations && selectedProduct.variations) {
      // For variation products, find the variation that matches the current color
      const variation = selectedProduct.variations.find((v: any) => v.color.hex_code === productColor)
      return variation?.id || null
    } else {
      // For single products, create a virtual variation ID based on product ID and view mode
      // This allows separate designs for each angle view
      const virtualVariationId = `single_${selectedProduct.id}_${viewMode}`
      console.log('🔄 [useVariationDesignPersistence] Single product virtual variation ID:', {
        productId: selectedProduct.id,
        viewMode,
        virtualVariationId
      })
      return virtualVariationId
    }
  }, [selectedProduct, productColor, viewMode])
  
  // Get all variation IDs that have the current view mode
  const getVariationsWithCurrentView = useCallback(() => {
    if (!selectedProduct) return []
    
    if (selectedProduct.hasVariations && selectedProduct.variations) {
      // For variation products, find variations with the current view mode
      const variationsWithView = selectedProduct.variations
        .filter((v: any) => {
          // Check if this variation has an image for the current view mode
          return v.images?.some((img: any) => img.angle === viewMode && img.url && img.url.trim() !== '')
        })
        .map((v: any) => v.id)
        .filter((id: any) => Boolean(id))
      
      console.log('🔄 [useVariationDesignPersistence] Variations with view', viewMode, ':', variationsWithView)
      return variationsWithView
    } else {
      // For single products, check if the current view mode has an image
      const hasCurrentView = (selectedProduct as any)[`${viewMode}Image`] && 
                            (selectedProduct as any)[`${viewMode}Image`].trim() !== ''
      
      if (hasCurrentView) {
        const virtualVariationId = `single_${selectedProduct.id}_${viewMode}`
        console.log('🔄 [useVariationDesignPersistence] Single product with view', viewMode, ':', [virtualVariationId])
        return [virtualVariationId]
      }
      
      return []
    }
  }, [selectedProduct, viewMode])
  
  // Get all variations that have a specific view mode (for design sharing)
  const getVariationsWithSpecificView = useCallback((specificViewMode: string) => {
    if (!selectedProduct) return []
    
    if (selectedProduct.hasVariations && selectedProduct.variations) {
      // For variation products, find variations with the specific view mode
      const variationsWithView = selectedProduct.variations
        .filter((v: any) => {
          // Check if this variation has an image for the specific view mode
          return v.images?.some((img: any) => img.angle === specificViewMode && img.url && img.url.trim() !== '')
        })
        .map((v: any) => v.id)
        .filter((id: any) => Boolean(id))
      
      console.log('🔄 [useVariationDesignPersistence] Variations with view', specificViewMode, ':', variationsWithView)
      return variationsWithView
    } else {
      // For single products, check if the specific view mode has an image
      const hasSpecificView = (selectedProduct as any)[`${specificViewMode}Image`] && 
                             (selectedProduct as any)[`${specificViewMode}Image`].trim() !== ''
      
      if (hasSpecificView) {
        const virtualVariationId = `single_${selectedProduct.id}_${specificViewMode}`
        console.log('🔄 [useVariationDesignPersistence] Single product with view', specificViewMode, ':', [virtualVariationId])
        return [virtualVariationId]
      }
      
      return []
    }
  }, [selectedProduct])
  
  // Get all available view modes for the current product
  const getAvailableViewModes = useCallback(() => {
    if (!selectedProduct) {
      console.log('😂 [useVariationDesignPersistence] No selected product')
      return []
    }
    
    console.log('😂 [useVariationDesignPersistence] getAvailableViewModes called for product:', {
      name: selectedProduct.name,
      hasVariations: selectedProduct.hasVariations,
      // Debug single product angle images
      singleProductImages: !selectedProduct.hasVariations ? {
        frontImage: (selectedProduct as any).frontImage,
        backImage: (selectedProduct as any).backImage,
        leftImage: (selectedProduct as any).leftImage,
        rightImage: (selectedProduct as any).rightImage,
        materialImage: (selectedProduct as any).materialImage
      } : null
    })
    
    if (selectedProduct.hasVariations && selectedProduct.variations) {
      console.log('😂 [useVariationDesignPersistence] Processing variation product')
      // For variation products, get view modes from the first variation
      const firstVariation = selectedProduct.variations[0]
      if (firstVariation?.images) {
        const viewModes = firstVariation.images
          .filter((img: any) => img.angle && img.url && img.url.trim() !== '')
          .map((img: any) => img.angle)
        console.log('😂 [useVariationDesignPersistence] Variation product view modes:', viewModes)
        return viewModes
      }
      console.log('😂 [useVariationDesignPersistence] No variation images found')
      return []
    } else {
      console.log('😂 [useVariationDesignPersistence] Processing single product')
      // For single products, check individual angle images
      const viewModes: string[] = []
      const angleFields = ['front', 'back', 'left', 'right', 'material']
      
      angleFields.forEach(angle => {
        const imageField = `${angle}Image`
        const imageValue = (selectedProduct as any)[imageField]
        if (imageValue && imageValue.trim() !== '') {
          viewModes.push(angle)
          console.log(`😂 [useVariationDesignPersistence] Found ${angle} image:`, imageValue)
        } else {
          console.log(`😂 [useVariationDesignPersistence] No ${angle} image found`)
        }
      })
      
      console.log('😂 [useVariationDesignPersistence] Single product available view modes:', viewModes)
      return viewModes
    }
  }, [selectedProduct])

  // Get all designed angles for the current variation
  const getAllDesignedAngles = useCallback(() => {
    if (!selectedProduct) return []
    
    const currentVariationId = getCurrentVariationId()
    if (!currentVariationId) return []
    
    const availableViewModes = getAvailableViewModes()
    const designedAngles: Array<{ angle: string; hasDesign: boolean; designData?: any }> = []
    
    availableViewModes.forEach((viewMode: string) => {
      const design = variationDesigns.find(
        d => d.variationId === currentVariationId && d.viewMode === viewMode
      )
      
      designedAngles.push({
        angle: viewMode,
        hasDesign: !!design,
        designData: design || null
      })
    })
    
    console.log('🔄 [useVariationDesignPersistence] All designed angles for variation:', {
      variationId: currentVariationId,
      designedAngles: designedAngles.map(d => ({ angle: d.angle, hasDesign: d.hasDesign }))
    })
    
    return designedAngles
  }, [selectedProduct, getCurrentVariationId, getAvailableViewModes, variationDesigns])
  
  // Save designs to localStorage
  const saveToLocalStorage = useCallback((designs: any[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
    } catch (error) {
      console.error('Error saving designs to localStorage:', error)
    }
  }, [])
  
  // Load designs from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading designs from localStorage:', error)
    }
    return []
  }, [])
  
  // Load design for current variation and view
  const loadCurrentDesign = useCallback(() => {
    if (!fabricCanvas) return false
    
    const variationId = getCurrentVariationId()
    if (!variationId) {
      console.log('🔄 [useVariationDesignPersistence] No variation ID available for loading design')
      return false
    }
    
    const design = variationDesigns.find(
      d => d.variationId === variationId && d.viewMode === viewMode
    )
    
    if (design) {
      try {
        fabricCanvas.loadFromJSON(design.canvasJSON, () => {
          fabricCanvas.requestRenderAll()
          console.log('📂 [useVariationDesignPersistence] Loaded design:', {
            variationId,
            viewMode,
            isShared: design.isShared,
            isSingleProduct: variationId.startsWith('single_')
          })
        })
        return true
      } catch (error) {
        console.error('Error loading design:', error)
        return false
      }
    }
    
    console.log('🔄 [useVariationDesignPersistence] No design found for:', {
      variationId,
      viewMode,
      isSingleProduct: variationId.startsWith('single_')
    })
    return false
  }, [fabricCanvas, getCurrentVariationId, viewMode, variationDesigns])
  
  // Clear design for current variation and view
  const clearCurrentDesign = useCallback(() => {
    if (!fabricCanvas) return
    
    const variationId = getCurrentVariationId()
    if (!variationId) {
      console.log('🔄 [useVariationDesignPersistence] No variation ID available for clearing design')
      return
    }
    
    // Clear the canvas
    fabricCanvas.clear()
    fabricCanvas.requestRenderAll()
    
    // Remove the design from state
    dispatch(clearVariationDesign({ variationId, viewMode }))
    
    console.log('🗑️ [useVariationDesignPersistence] Cleared design:', { 
      variationId, 
      viewMode,
      isSingleProduct: variationId.startsWith('single_')
    })
  }, [fabricCanvas, getCurrentVariationId, viewMode, dispatch])
  
  // Load designs from localStorage on mount
  useEffect(() => {
    const storedDesigns = loadFromLocalStorage()
    if (storedDesigns.length > 0) {
      // Dispatch actions to restore designs to Redux state
      storedDesigns.forEach((design: any) => {
        dispatch(saveVariationDesign({
          variationId: design.variationId,
          viewMode: design.viewMode,
          canvasJSON: design.canvasJSON,
          isShared: design.isShared
        }))
      })
      
      console.log('📂 [useVariationDesignPersistence] Loaded designs from localStorage:', storedDesigns.length)
    }
  }, [dispatch, loadFromLocalStorage])

  // Enhanced save function that tracks if design was manually modified
  const saveCurrentDesign = useCallback((canvasJSON?: any, isManualModification = false) => {
    if (!fabricCanvas) return
    
    const variationId = getCurrentVariationId()
    if (!variationId) {
      console.log('🔄 [useVariationDesignPersistence] No variation ID available for saving design')
      return
    }
    
    const canvasData = canvasJSON || fabricCanvas.toJSON()
    
    // Check if this is a new design (no existing design for this variation+view)
    const existingDesign = variationDesigns.find(
      d => d.variationId === variationId && d.viewMode === viewMode
    )
    
    const isNewDesign = !existingDesign
    
    console.log('💾 [useVariationDesignPersistence] Saving design:', {
      variationId,
      viewMode,
      isNewDesign,
      isManualModification,
      hasExistingDesign: !!existingDesign,
      isSingleProduct: variationId.startsWith('single_')
    })
    
    // Save the design with manual modification flag
    dispatch(saveVariationDesign({
      variationId,
      viewMode,
      canvasJSON: canvasData,
      isShared: false
    }))
    
    // Only auto-share if this is a new design AND not manually modified
    if (isNewDesign && !isManualModification) {
      // Get all variations that have this same view mode
      const variationsWithSameView = getVariationsWithSpecificView(viewMode)
      const targetVariationIds = variationsWithSameView.filter((id: any) => id !== variationId)
      
      console.log('🔄 [useVariationDesignPersistence] Auto-sharing design to variations with same view:', {
        viewMode,
        sourceVariation: variationId,
        targetVariations: targetVariationIds,
        isSingleProduct: variationId.startsWith('single_')
      })
      
      if (targetVariationIds.length > 0) {
        dispatch(shareDesignAcrossVariations({
          sourceVariationId: variationId,
          viewMode,
          canvasJSON: canvasData,
          targetVariationIds
        }))
        
        console.log('✅ [useVariationDesignPersistence] Design auto-shared successfully to variations:', targetVariationIds)
      } else {
        console.log('ℹ️ [useVariationDesignPersistence] No other variations have this view mode to share with')
      }
    } else if (isManualModification) {
      console.log('💾 [useVariationDesignPersistence] Design saved with manual modification flag:', {
        variationId,
        viewMode,
        isManuallyModified: true
      })
    }
    
    // Store last canvas state for change detection
    lastCanvasStateRef.current = JSON.stringify(canvasData)
  }, [fabricCanvas, getCurrentVariationId, viewMode, variationDesigns, dispatch, getVariationsWithSpecificView])

  // Auto-save handler with debouncing
  const handleAutoSave = useCallback((isManualModification = false) => {
    if (!fabricCanvas || !autoSaveEnabled || !getCurrentVariationId()) return
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      const currentCanvasState = JSON.stringify(fabricCanvas.toJSON())
      
      // Only save if canvas has actually changed
      if (currentCanvasState !== lastCanvasStateRef.current) {
        saveCurrentDesign(undefined, isManualModification)
      }
    }, autoSaveDelay)
  }, [fabricCanvas, autoSaveEnabled, getCurrentVariationId, saveCurrentDesign, autoSaveDelay])
  
  // Set up canvas event listeners for auto-save
  useEffect(() => {
    if (!fabricCanvas || !autoSaveEnabled) return
    
    const handleCanvasChange = () => {
      // Mark this as a manual modification
      handleAutoSave(true)
    }
    
    // Listen to canvas changes
    fabricCanvas.on('object:added', handleCanvasChange)
    fabricCanvas.on('object:modified', handleCanvasChange)
    fabricCanvas.on('object:removed', handleCanvasChange)
    fabricCanvas.on('object:moving', handleCanvasChange)
    fabricCanvas.on('object:scaling', handleCanvasChange)
    fabricCanvas.on('object:rotating', handleCanvasChange)
    
    return () => {
      fabricCanvas.off('object:added', handleCanvasChange)
      fabricCanvas.off('object:modified', handleCanvasChange)
      fabricCanvas.off('object:removed', handleCanvasChange)
      fabricCanvas.off('object:moving', handleCanvasChange)
      fabricCanvas.off('object:scaling', handleCanvasChange)
      fabricCanvas.off('object:rotating', handleCanvasChange)
    }
  }, [fabricCanvas, autoSaveEnabled, handleAutoSave])
  
  // Auto-load design when variation or view changes
  useEffect(() => {
    if (fabricCanvas && getCurrentVariationId()) {
      const designLoaded = loadCurrentDesign()
      
      if (!designLoaded) {
        // If no design found, clear the canvas
        fabricCanvas.clear()
        fabricCanvas.requestRenderAll()
        console.log('🔄 [useVariationDesignPersistence] No design found, canvas cleared')
      }
    }
  }, [fabricCanvas, getCurrentVariationId, viewMode, loadCurrentDesign])

  // Additional effect to handle product restoration after hook initialization
  useEffect(() => {
    if (fabricCanvas && selectedProduct && getCurrentVariationId()) {
      console.log('🔄 [useVariationDesignPersistence] Product restored, attempting to load design')
      
      // Small delay to ensure canvas is ready
      setTimeout(() => {
        const designLoaded = loadCurrentDesign()
        if (designLoaded) {
          console.log('🔄 [useVariationDesignPersistence] Design successfully loaded after product restoration')
        } else {
          console.log('🔄 [useVariationDesignPersistence] No design found after product restoration')
        }
      }, 100)
    }
  }, [selectedProduct?.id, fabricCanvas, loadCurrentDesign, getCurrentVariationId])
  
  // Persist designs to localStorage whenever they change
  useEffect(() => {
    if (variationDesigns.length > 0) {
      saveToLocalStorage(variationDesigns)
    }
  }, [variationDesigns, saveToLocalStorage])
  
  // Initial design sharing across variations when product is first loaded
  useEffect(() => {
    if (!selectedProduct?.hasVariations || !selectedProduct?.variations || variationDesigns.length === 0) return
    
    console.log('🔄 [useVariationDesignPersistence] Checking for initial design sharing opportunities')
    
    // Get all variations for this product
    const allVariations = selectedProduct.variations
    const allViewModes = ['front', 'back', 'left', 'right'] // Common view modes
    
    console.log('🔄 [useVariationDesignPersistence] Product variations:', allVariations.map((v: any) => ({
      id: v.id,
      color: v.color?.hex_code,
      views: v.images?.map((img: any) => img.angle) || []
    })))
    
    allViewModes.forEach(viewMode => {
      // Find variations that have this view mode (have images for it)
      const variationsWithView = allVariations.filter((v: any) => 
        v.images?.some((img: any) => img.angle === viewMode && img.url && img.url.trim() !== '')
      )
      
      console.log(`🔄 [useVariationDesignPersistence] View ${viewMode}:`, {
        variationsWithView: variationsWithView.length,
        variationIds: variationsWithView.map((v: any) => v.id)
      })
      
      if (variationsWithView.length <= 1) {
        console.log(`ℹ️ [useVariationDesignPersistence] Skipping ${viewMode} - only ${variationsWithView.length} variation(s) have this view`)
        return // Need at least 2 variations to share
      }
      
      // Find the first variation that has a design for this view
      const sourceVariation = variationsWithView.find((v: any) => {
        const variationId = v.id
        return variationDesigns.some(d => 
          d.variationId === variationId && d.viewMode === viewMode
        )
      })
      
      if (!sourceVariation) {
        console.log(`ℹ️ [useVariationDesignPersistence] No source design found for ${viewMode} view`)
        return // No source design found
      }
      
      const sourceVariationId = sourceVariation.id
      const sourceDesign = variationDesigns.find(d => 
        d.variationId === sourceVariationId && d.viewMode === viewMode
      )
      
      if (!sourceDesign) {
        console.log(`ℹ️ [useVariationDesignPersistence] Source design not found for ${viewMode} view`)
        return
      }
      
      // Find target variations that don't have a design for this view yet
      const targetVariationIds = variationsWithView
        .filter((v: any) => v.id !== sourceVariationId)
        .filter((v: any) => {
          const variationId = v.id
          return !variationDesigns.some(d => 
            d.variationId === variationId && d.viewMode === viewMode
          )
        })
        .map((v: any) => v.id)
      
      if (targetVariationIds.length > 0) {
        console.log(`🔄 [useVariationDesignPersistence] Initial sharing for ${viewMode} view:`, {
          viewMode,
          sourceVariation: sourceVariationId,
          targetVariations: targetVariationIds,
          isInitialShare: true
        })
        
        // Share the design to target variations
        dispatch(shareDesignAcrossVariations({
          sourceVariationId,
          viewMode,
          canvasJSON: sourceDesign.canvasJSON,
          targetVariationIds
        }))
        
        console.log(`✅ [useVariationDesignPersistence] Initial design sharing completed for ${viewMode} view`)
      } else {
        console.log(`ℹ️ [useVariationDesignPersistence] All variations already have designs for ${viewMode} view`)
      }
    })
  }, [selectedProduct?.id, variationDesigns, dispatch])
  
  // Manual design sharing function for design management panel
  const shareDesignToVariations = useCallback((targetVariationIds: string[]) => {
    if (!fabricCanvas || !getCurrentVariationId()) return false
    
    const variationId = getCurrentVariationId()
    const currentDesign = variationDesigns.find(
      d => d.variationId === variationId && d.viewMode === viewMode
    )
    
    if (!currentDesign) {
      console.warn('No current design to share')
      return false
    }
    
    // Get all variations that have this same view mode
    const variationsWithSameView = getVariationsWithSpecificView(viewMode)
    
    // Filter target variations to only include those that have this view mode
    const validTargets = targetVariationIds.filter(targetId => {
      // Check if target variation has this view mode
      const hasView = variationsWithSameView.includes(targetId)
      
      // Check if target variation already has a design for this view
      const existingDesign = variationDesigns.find(
        d => d.variationId === targetId && d.viewMode === viewMode
      )
      
      if (!hasView) {
        console.log(`ℹ️ [useVariationDesignPersistence] Skipping variation ${targetId} - doesn't have ${viewMode} view`)
        return false
      }
      
      if (existingDesign) {
        console.log(`ℹ️ [useVariationDesignPersistence] Skipping variation ${targetId} - already has design for ${viewMode} view`)
        return false
      }
      
      return true
    })
    
    if (validTargets.length === 0) {
      console.log('ℹ️ [useVariationDesignPersistence] No valid target variations to share with')
      return false
    }
    
    console.log('🔄 [useVariationDesignPersistence] Manually sharing design to variations:', {
      sourceVariation: variationId,
      targetVariations: validTargets,
      viewMode,
      totalVariationsWithView: variationsWithSameView.length
    })
    
    dispatch(shareDesignAcrossVariations({
      sourceVariationId: variationId,
      viewMode,
      canvasJSON: currentDesign.canvasJSON,
      targetVariationIds: validTargets
    }))
    
    console.log('✅ [useVariationDesignPersistence] Design manually shared successfully to variations:', validTargets)
    
    return true
  }, [fabricCanvas, getCurrentVariationId, viewMode, variationDesigns, dispatch, getVariationsWithSpecificView])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])
  
  return {
    saveCurrentDesign,
    loadCurrentDesign,
    clearCurrentDesign,
    handleAutoSave,
    getCurrentVariationId,
    getVariationsWithCurrentView,
    getVariationsWithSpecificView, // New function for design sharing
    getAvailableViewModes, // New function for single products
    getAllDesignedAngles, // New function for getting all designed angles
    hasCurrentDesign: variationDesigns.some(
      d => d.variationId === getCurrentVariationId() && d.viewMode === viewMode
    ),
    saveToLocalStorage,
    loadFromLocalStorage,
    shareDesignToVariations // New function for manual sharing
  }
}
