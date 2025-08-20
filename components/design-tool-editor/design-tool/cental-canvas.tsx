"use client"

import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useFabricCanvas } from "@/hooks/useFabricCanvas"
import { setViewMode, setSelectedProduct, setProductColor, setSelectedTemplate } from "@/lib/redux/designToolSlices/designSlice"
import { Button } from "@/components/ui/button"
import { RootState } from "@/lib/redux/store"
import Image from "next/image"
import { ProductAnglesSelector } from "@/components/dashboard/common/ProductAnglesSelector"
import { LoadSavedDesign } from "./load-saved-design"
import { useVariationDesignPersistence } from "@/hooks/useVariationDesignPersistence"

// Type definition for product
interface Product {
  id: string;
  name: string;
  type: string;
  baseColor: string;
  angles?: string[];
  colors?: string[];
  price?: string;
  image?: string;
  hasVariations?: boolean;
  variations?: any[];
}

export function CentralCanvas() {
  const dispatch = useDispatch()
  const { selectedTool, viewMode, selectedProduct, productColor, imageLayers, selectedTemplate } = useSelector((state: RootState) => state.design)
  const { selectedObject } = useSelector((state: RootState) => state.canvas)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  
  // State for tracking if a saved design is loaded
  const [isLoadingDesign, setIsLoadingDesign] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const { canvasRef, loadFromJSON } = useFabricCanvas("design-canvas")
  
  // Get the Fabric.js canvas instance safely
  const getFabricCanvas = useCallback(() => {
    if (typeof window === 'undefined') return null
    return (window as any).fabricCanvas
  }, [])
  
  // Initialize variation design persistence only on client side
  const variationDesignPersistence = useVariationDesignPersistence({
    fabricCanvas: isClient ? getFabricCanvas() : null,
    selectedProduct,
    productColor,
    viewMode,
    autoSaveDelay: 1000
  })
  
  // Set client-side flag
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Persist current design session (product + view + template) on change
  useEffect(() => {
    if (!isClient) return // Only run on client
    
    try {
        const sessionState = {
        selectedProduct: selectedProduct ? {
          id: selectedProduct.id,
          name: selectedProduct.name,
          type: selectedProduct.type,
          categoryId: selectedProduct.categoryId,
          baseColor: selectedProduct.baseColor,
          angles: selectedProduct.angles,
          colors: selectedProduct.colors,
          price: selectedProduct.price,
          image: selectedProduct.image,
          description: selectedProduct.description,
          inStock: selectedProduct.inStock,
          hasVariations: selectedProduct.hasVariations,
          variations: selectedProduct.variations,
          purchaseLimit: selectedProduct.purchaseLimit, // Add purchase limit data
        } : null,
          productColor,
          viewMode,
          selectedTemplate,
        timestamp: Date.now(), // Add timestamp for debugging
        }
        localStorage.setItem('designSessionState', JSON.stringify(sessionState))
      
      console.log('💾 [CentralCanvas] Session state persisted:', {
        productId: selectedProduct?.id,
        productName: selectedProduct?.name,
        productColor,
        viewMode,
        hasTemplate: !!selectedTemplate,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error persisting session state:', error)
    }
  }, [selectedProduct, productColor, viewMode, selectedTemplate, isClient])

  // Restore persisted design session after refresh
  useEffect(() => {
    if (!isClient) return // Only run on client
    
    try {
      const sessionRaw = localStorage.getItem('designSessionState')
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw)
        console.log('🔄 [CentralCanvas] Restoring session from localStorage:', session)
        
        // Check if the session product has purchaseLimit
        if (session.selectedProduct) {
          console.log('🔄 [CentralCanvas] Session product data:', {
            hasPurchaseLimit: !!session.selectedProduct.purchaseLimit,
            purchaseLimit: session.selectedProduct.purchaseLimit,
            allKeys: Object.keys(session.selectedProduct)
          })
        }
        
        // Restore product selection first
        if (session.selectedProduct && !selectedProduct) {
          console.log('🔄 [CentralCanvas] Restoring selected product from session')
          dispatch(setSelectedProduct(session.selectedProduct))
        }
        
        // Restore other session state
        if (session.productColor && session.productColor !== productColor) {
          dispatch(setProductColor(session.productColor))
        }
        if (session.viewMode && session.viewMode !== viewMode) {
          dispatch(setViewMode(session.viewMode))
        }
        if (session.selectedTemplate && !selectedTemplate) {
          dispatch(setSelectedTemplate(session.selectedTemplate))
        }
      }
    } catch (error) {
      console.error('Error restoring session state:', error)
    }
  }, [dispatch, isClient, selectedProduct, productColor, viewMode, selectedTemplate])

  // Ensure product is present after refresh: use session data or fetch by productId from URL if missing
  useEffect(() => {
    if (!isClient) return // Only run on client
    
    try {
      // Check if we have a product ID in the URL
      const urlParams = new URLSearchParams(window.location.search)
      const productIdFromUrl = urlParams.get('productId')
      
      // Check if we have a product ID in session
        const sessionRaw = localStorage.getItem('designSessionState')
      const session = sessionRaw ? JSON.parse(sessionRaw) : {}
      const productIdFromSession = session.selectedProduct?.id
      
      // Determine which product ID to use
      const targetProductId = productIdFromUrl || productIdFromSession
      
      // Only fetch from API if we don't have the product data in session
      if (targetProductId && (!selectedProduct || selectedProduct.id !== targetProductId) && !session.selectedProduct) {
        console.log('🔄 [CentralCanvas] Fetching product from API (no session data):', targetProductId)
        
        // Fetch the product data
        fetch(`/api/products/${targetProductId}`)
          .then(res => res.json())
          .then(productData => {
            if (productData && productData.id) {
              console.log('🔄 [CentralCanvas] Product restored from API:', productData.name)
              
              // Build the selectedProduct object with the same structure as ProductModal
              const restoredProduct = {
                id: productData.id,
                name: productData.name,
                type: productData.categoryId,
                categoryId: productData.categoryId,
                baseColor: session.productColor || productData.baseColor || "",
                angles: session.viewMode ? [session.viewMode] : [],
                colors: productData.hasVariations && productData.variations 
                  ? productData.variations.map((v: any) => v.color?.hex_code).filter(Boolean)
                  : [],
                price: productData.price,
                image: productData.image,
                description: productData.description,
                inStock: productData.inStock,
                hasVariations: productData.hasVariations,
                variations: productData.variations || [],
                purchaseLimit: productData.purchaseLimit, // Add purchase limit data
              }
              
              dispatch(setSelectedProduct(restoredProduct))
              
              // Also restore the color and view mode if they were in session
              if (session.productColor) {
                dispatch(setProductColor(session.productColor))
              } else if (restoredProduct.colors && restoredProduct.colors.length > 0) {
                // If no color in session, use the first available color
                const defaultColor = restoredProduct.colors[0]
                console.log('🔄 [CentralCanvas] Setting default color:', defaultColor)
                dispatch(setProductColor(defaultColor))
              }
              if (session.viewMode) {
                dispatch(setViewMode(session.viewMode))
              } else if (restoredProduct.angles && restoredProduct.angles.length > 0) {
                // If no view mode in session, use the first available angle
                const defaultViewMode = restoredProduct.angles[0]
                console.log('🔄 [CentralCanvas] Setting default view mode:', defaultViewMode)
                dispatch(setViewMode(defaultViewMode))
              }
            }
          })
          .catch(error => {
            console.error('Error fetching product for restoration:', error)
          })
      }
    } catch (error) {
      console.error('Error in product restoration logic:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, selectedProduct?.id])

  // Ensure canvas displays product image when product is restored
  useEffect(() => {
    if (isClient && selectedProduct && getFabricCanvas() && !isLoadingDesign) {
      console.log('🔄 [CentralCanvas] Product restored, ensuring canvas displays product image')
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        // Force a re-render of the canvas to show the product image
        if (getFabricCanvas()) {
          getFabricCanvas()?.requestRenderAll()
          console.log('🔄 [CentralCanvas] Canvas re-rendered after product restoration')
        }
        
        // Force a re-render of the component to update the product image
        const event = new Event('resize')
        window.dispatchEvent(event)
        console.log('🔄 [CentralCanvas] Component re-render triggered after product restoration')
      }, 200)
    }
  }, [selectedProduct?.id, getFabricCanvas, isClient, isLoadingDesign])
  
  // Handle loading a saved design
  const handleDesignLoaded = useCallback((canvasJSON: any) => {
    if (canvasJSON && loadFromJSON) {
      setIsLoadingDesign(true)
      // Short delay to ensure canvas is initialized
      setTimeout(() => {
        loadFromJSON(canvasJSON)
        setIsLoadingDesign(false)
      }, 500)
    }
  }, [loadFromJSON])

  const handleViewChange = (view: string) => {
    // Before switching, save current design
    if (isClient && getFabricCanvas() && selectedProduct && variationDesignPersistence.getCurrentVariationId()) {
      variationDesignPersistence.saveCurrentDesign()
    }
    
    dispatch(setViewMode(view))
    
    // After switching, the useVariationDesignPersistence hook will automatically load the design
    // for the new view mode if it exists
  }

  // Determine if canvas border should be visible based on selected tool
  const shouldShowCanvasBorder = () => {
    // Only show border when design tools are actively selected
    // This provides clean UI when browsing products and clear feedback when designing
    return selectedProduct !== null && 
           (selectedTool === "text" || selectedTool === "template" || selectedTool === "upload")
  }

  // Get product angles from the selected product
  const getProductAngles = () => {
    if (!selectedProduct) {
      console.log('😂 [CentralCanvas] No selected product - returning empty angles')
      return [] // No angles when no product is selected
    }
    
    const product = selectedProduct as Product;
    console.log('😂 [CentralCanvas] getProductAngles called for product:', {
      name: product.name,
      hasVariations: product.hasVariations,
      variationsCount: product.variations?.length,
      productColor,
      // Debug single product angle images
      singleProductImages: !product.hasVariations ? {
        frontImage: (product as any).frontImage,
        backImage: (product as any).backImage,
        leftImage: (product as any).leftImage,
        rightImage: (product as any).rightImage,
        materialImage: (product as any).materialImage
      } : null
    })
    
    // If product has variations, collect angles ONLY from the current variation
    if (product.hasVariations && product.variations) {
      console.log('😂 [CentralCanvas] Processing variation product')
      // Find the variation that matches the current product color
      const currentVariation = product.variations.find((v: any) => v.color.hex_code === productColor)
      
      if (currentVariation && currentVariation.images) {
        const angleSet = new Set<string>()
        
        // Collect angles ONLY from the current variation's images
        currentVariation.images.forEach((img: any) => {
          if (img?.angle && img.url && img.url.trim() !== '') {
            angleSet.add(img.angle)
          }
        })
        
        // Return only the angles that have actual images for this specific variation
        if (angleSet.size > 0) {
          const angles = Array.from(angleSet)
          console.log('😂 [CentralCanvas] Variation product angles found:', angles)
          return angles
        }
      }
      console.log('😂 [CentralCanvas] No valid variation images found')
      return []
    } else {
      console.log('😂 [CentralCanvas] Processing single product')
      // For single products, use the hook's getAvailableViewModes function
      if (variationDesignPersistence.getAvailableViewModes) {
        const availableViewModes = variationDesignPersistence.getAvailableViewModes()
        console.log('😂 [CentralCanvas] Single product angles from hook:', availableViewModes)
        return availableViewModes
      }
      
      // Fallback to manual checking if hook function not available
      const angleImages = [
        { angle: 'front', image: (product as any).frontImage },
        { angle: 'back', image: (product as any).backImage },
        { angle: 'left', image: (product as any).leftImage },
        { angle: 'right', image: (product as any).rightImage },
        { angle: 'material', image: (product as any).materialImage }
      ]
      
      const availableAngles: string[] = []
      angleImages.forEach(({ angle, image }) => {
        if (image && image.trim() !== '') {
          availableAngles.push(angle)
          console.log(`😂 [CentralCanvas] Found valid ${angle} image:`, image)
        } else {
          console.log(`😂 [CentralCanvas] No valid ${angle} image found`)
        }
      })
      
      if (availableAngles.length > 0) {
        console.log('😂 [CentralCanvas] Single product angles found manually:', availableAngles)
        return availableAngles
      }
      
      console.log('😂 [CentralCanvas] No single product angles found')
    }
    
    // No fallback - if no images found, return empty array
    console.log('😂 [CentralCanvas] Returning empty angles array')
    return []
  }

  // Get image for current view mode (robust across partial product restore)
  const getCurrentImage = () => {
    if (!selectedProduct) return null
    
    const product = selectedProduct as Product;
    
    // If product has variations, try to find image for current view mode
    if (product.hasVariations && product.variations) {
      // Find the variation that matches the current product color
      const currentVariation = product.variations.find((v: any) => v.color.hex_code === productColor)
      if (currentVariation) {
        const imageForAngle = currentVariation.images?.find((img: any) => img.angle === viewMode && img.url)
        if (imageForAngle) {
          return imageForAngle.url
        }
        // Fallback to swatch image or main product image
        return currentVariation.color.swatch_image || product.image
      }
    } else {
      // For single products without variations, check individual angle images
      const angleImageMap: Record<string, string> = {
        'front': (product as any).frontImage,
        'back': (product as any).backImage,
        'left': (product as any).leftImage,
        'right': (product as any).rightImage,
        'material': (product as any).materialImage
      }
      
      const currentAngleImage = angleImageMap[viewMode]
      
      // Debug logging for single product image selection
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [CentralCanvas] getCurrentImage for single product:', {
          viewMode,
          angleImageMap,
          currentAngleImage,
          hasCurrentAngleImage: !!(currentAngleImage && currentAngleImage.trim() !== ''),
          imageLength: currentAngleImage ? currentAngleImage.length : 0
        })
      }
      
      if (currentAngleImage && currentAngleImage.trim() !== '') {
        return currentAngleImage
      }
    }
    
    // Fallback to main product image
    return (product as any).image || null
  }

  // Debug logging for image restoration
  useEffect(() => {
    if (isClient && selectedProduct && process.env.NODE_ENV === 'development') {
      console.log('🖼️ [CentralCanvas] Image restoration debug:', {
        productName: selectedProduct.name,
        productColor,
        viewMode,
        hasVariations: selectedProduct.hasVariations,
        variationsCount: selectedProduct.variations?.length,
        currentVariation: getCurrentVariation(),
        currentImage: getCurrentImage(),
        fallbackImage: (selectedProduct as any).image,
        // Debug single product angle images
        singleProductAngles: !selectedProduct.hasVariations ? {
          frontImage: (selectedProduct as any).frontImage,
          backImage: (selectedProduct as any).backImage,
          leftImage: (selectedProduct as any).leftImage,
          rightImage: (selectedProduct as any).rightImage,
          materialImage: (selectedProduct as any).materialImage,
          angles: selectedProduct.angles
        } : null,
        // Debug raw product data
        rawProductData: {
          allKeys: Object.keys(selectedProduct),
          hasFrontImage: !!(selectedProduct as any).frontImage,
          hasBackImage: !!(selectedProduct as any).backImage,
          hasLeftImage: !!(selectedProduct as any).leftImage,
          hasRightImage: !!(selectedProduct as any).rightImage,
          hasMaterialImage: !!(selectedProduct as any).materialImage
        }
      })
    }
  }, [selectedProduct, productColor, viewMode, isClient])

  // Get current variation images for the selected color
  const getCurrentVariationImages = () => {
    if (!selectedProduct) {
      console.log('😂 [CentralCanvas] getCurrentVariationImages: No selected product')
      return []
    }
    
    const product = selectedProduct as Product;
    console.log('😂 [CentralCanvas] getCurrentVariationImages called for product:', {
      name: product.name,
      hasVariations: product.hasVariations,
      productColor
    })
    
    // If product has variations, find images for the current color variation
    if (product.hasVariations && product.variations) {
      console.log('😂 [CentralCanvas] Processing variation product for images')
      // Find the variation that matches the current product color
      const currentVariation = product.variations.find((v: any) => v.color.hex_code === productColor)
      
      if (!currentVariation || !currentVariation.images) {
        console.log('😂 [CentralCanvas] No current variation or images found')
        return []
      }
    
      // Filter out images without valid URLs and return only valid images
      const validImages = currentVariation.images.filter((img: any) => img.url && img.url.trim() !== '')
      console.log('😂 [CentralCanvas] Variation product valid images:', validImages)
      return validImages
    } else {
      console.log('😂 [CentralCanvas] Processing single product for images')
      // For single products without variations, return individual angle images
      const individualImages = []
      
      if ((product as any).frontImage && (product as any).frontImage.trim() !== '') {
        individualImages.push({
          id: 'front_img',
          url: (product as any).frontImage,
          alt_text: (product as any).frontAltText || '',
          angle: 'front',
          is_primary: true
        })
        console.log('😂 [CentralCanvas] Added front image:', (product as any).frontImage)
      }
      
      if ((product as any).backImage && (product as any).backImage.trim() !== '') {
        individualImages.push({
          id: 'back_img',
          url: (product as any).backImage,
          alt_text: (product as any).backAltText || '',
          angle: 'back',
          is_primary: false
        })
        console.log('😂 [CentralCanvas] Added back image:', (product as any).backImage)
      }
      
      if ((product as any).leftImage && (product as any).leftImage.trim() !== '') {
        individualImages.push({
          id: 'left_img',
          url: (product as any).leftImage,
          alt_text: (product as any).leftAltText || '',
          angle: 'left',
          is_primary: false
        })
        console.log('😂 [CentralCanvas] Added left image:', (product as any).leftImage)
      }
      
      if ((product as any).rightImage && (product as any).rightImage.trim() !== '') {
        individualImages.push({
          id: 'right_img',
          url: (product as any).rightImage,
          alt_text: (product as any).rightAltText || '',
          angle: 'right',
          is_primary: false
        })
        console.log('😂 [CentralCanvas] Added right image:', (product as any).rightImage)
      }
      
      if ((product as any).materialImage && (product as any).materialImage.trim() !== '') {
        individualImages.push({
          id: 'material_img',
          url: (product as any).materialImage,
          alt_text: (product as any).materialAltText || '',
          angle: 'material',
          is_primary: false
        })
        console.log('😂 [CentralCanvas] Added material image:', (product as any).materialImage)
      }
      
      console.log('😂 [CentralCanvas] Single product individual images:', individualImages)
      return individualImages
    }
  }

  // Get current variation (for both variation products and single products)
  const getCurrentVariation = () => {
    if (!selectedProduct) return null
    
    const product = selectedProduct as Product;
    
    if (product.hasVariations && product.variations) {
      // For variation products, find the variation that matches the current color
      return product.variations.find((v: any) => v.color.hex_code === productColor)
    } else {
      // For single products, create a virtual variation with individual angle images
      const individualImages = getCurrentVariationImages()
      if (individualImages.length > 0) {
        return {
          id: 'single_product_variation',
          color: { name: 'Default', hex_code: product.baseColor || '#000000', swatch_image: product.image },
          images: individualImages,
          price: product.price,
          inStock: (product as any).inStock || true,
          stockQuantity: 0,
          isDefault: true
        }
      }
    }
    
    return null
  }

  // Memoize expensive calculations to prevent unnecessary re-renders
  const angles = useMemo(() => getProductAngles(), [selectedProduct?.id, productColor, viewMode])
  const currentImage = useMemo(() => getCurrentImage(), [selectedProduct?.id, viewMode])
  const currentVariationImages = useMemo(() => getCurrentVariationImages(), [selectedProduct?.id, productColor])
  const currentVariation = useMemo(() => getCurrentVariation(), [selectedProduct?.id, productColor])

  // Debug logging for angles and images
  console.log('😂 [CentralCanvas] Main render debug:', {
    angles,
    anglesLength: angles.length,
    currentImage,
    currentVariationImagesCount: currentVariationImages.length,
    currentVariationImages,
    selectedProduct: selectedProduct ? {
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
    } : null
  })

  // Update view mode if current view mode is not available in new angles
  useEffect(() => {
    if (selectedProduct && angles.length > 0 && !angles.includes(viewMode)) {
      // If current view mode is not available in new angles, switch to first available angle
      dispatch(setViewMode(angles[0]))
    }
  }, [angles, viewMode, selectedProduct, dispatch])

  // Force refresh product data from API (bypass session)
  const forceRefreshProductFromAPI = useCallback(async () => {
    if (!selectedProduct?.id) {
      console.log('🔄 [CentralCanvas] No product ID available for force refresh')
      return
    }
    
    // Prevent multiple rapid calls to the same product - more aggressive debouncing
    const refreshKey = `force_refresh_${selectedProduct.id}`
    const lastRefresh = sessionStorage.getItem(refreshKey)
    const now = Date.now()
    
    if (lastRefresh && (now - parseInt(lastRefresh)) < 10000) { // Increased to 10 seconds
      console.log('🔄 [CentralCanvas] Force refresh blocked - too recent for product:', selectedProduct.id)
      return
    }
    
    // Mark this refresh attempt
    sessionStorage.setItem(refreshKey, now.toString())
    
    // Additional debounce: check if we're already in the process of refreshing
    const isRefreshingKey = `is_refreshing_${selectedProduct.id}`
    if (sessionStorage.getItem(isRefreshingKey)) {
      console.log('🔄 [CentralCanvas] Force refresh blocked - already in progress for product:', selectedProduct.id)
      return
    }
    
    // Mark that we're currently refreshing
    sessionStorage.setItem(isRefreshingKey, 'true')
    
    try {
      console.log('🔄 [CentralCanvas] Force refreshing product from API:', selectedProduct.id)
      
      const response = await fetch(`/api/products/${selectedProduct.id}`)
      const productData = await response.json()
      
      if (productData && productData.id) {
        console.log('🔄 [CentralCanvas] Product refreshed from API:', {
          name: productData.name,
          hasPurchaseLimit: !!productData.purchaseLimit,
          purchaseLimit: productData.purchaseLimit,
          price: productData.price,
          // Debug angle images for single products
          singleProductAngles: !productData.hasVariations ? {
            frontImage: productData.frontImage,
            backImage: productData.backImage,
            leftImage: productData.leftImage,
            rightImage: productData.rightImage,
            materialImage: productData.materialImage
          } : null
        })
        
        // Build the refreshed product object with the same structure as ProductModal
        const refreshedProduct = {
          id: productData.id,
          name: productData.name,
          type: productData.categoryId,
          categoryId: productData.categoryId,
          baseColor: productData.baseColor || "",
          angles: productData.angles || [],
          colors: productData.hasVariations && productData.variations 
            ? productData.variations.map((v: any) => v.color?.hex_code).filter(Boolean)
            : [],
          price: productData.price,
          image: productData.image,
          description: productData.description,
          inStock: productData.inStock,
          hasVariations: productData.hasVariations,
          variations: productData.variations || [],
          purchaseLimit: productData.purchaseLimit, // Include purchase limit data
          // Ensure single product angle images are included
          frontImage: productData.frontImage,
          backImage: productData.backImage,
          leftImage: productData.leftImage,
          rightImage: productData.rightImage,
          materialImage: productData.materialImage,
          frontAltText: productData.frontAltText,
          backAltText: productData.backAltText,
          leftAltText: productData.leftAltText,
          rightAltText: productData.rightAltText,
          materialAltText: productData.materialAltText
        }
        
        // Update the product in Redux state
        dispatch(setSelectedProduct(refreshedProduct))
        
        // Also update the session in localStorage with enhanced data
        const sessionRaw = localStorage.getItem('designSessionState')
        const session = sessionRaw ? JSON.parse(sessionRaw) : {}
        const updatedSession = {
          ...session,
          selectedProduct: refreshedProduct,
          timestamp: Date.now(),
          // Add metadata for better debugging
          lastRefresh: {
            timestamp: Date.now(),
            productId: refreshedProduct.id,
            hasAngleImages: !!(refreshedProduct as any).frontImage || !!(refreshedProduct as any).backImage || 
                           !!(refreshedProduct as any).leftImage || !!(refreshedProduct as any).rightImage || 
                           !!(refreshedProduct as any).materialImage,
            angleImagesCount: [
              (refreshedProduct as any).frontImage,
              (refreshedProduct as any).backImage,
              (refreshedProduct as any).leftImage,
              (refreshedProduct as any).rightImage,
              (refreshedProduct as any).materialImage
            ].filter(img => img && img.trim() !== '').length
          }
        }
        localStorage.setItem('designSessionState', JSON.stringify(updatedSession))
        
        console.log('🔄 [CentralCanvas] Product refreshed and session updated with angle images:', {
          hasAngleImages: updatedSession.lastRefresh.hasAngleImages,
          angleImagesCount: updatedSession.lastRefresh.angleImagesCount
        })
      }
    } catch (error) {
      console.error('🔄 [CentralCanvas] Error force refreshing product:', error)
    } finally {
      // Clear the refreshing flag
      if (selectedProduct?.id) {
        const isRefreshingKey = `is_refreshing_${selectedProduct.id}`
        sessionStorage.removeItem(isRefreshingKey)
      }
    }
  }, [selectedProduct?.id, dispatch])
  
  // Single consolidated useEffect for handling single product angle image refresh
  useEffect(() => {
    if (selectedProduct && !selectedProduct.hasVariations && isClient) {
      // Check if single product has angle images
      const hasAngleImages = [
        (selectedProduct as any).frontImage,
        (selectedProduct as any).backImage,
        (selectedProduct as any).leftImage,
        (selectedProduct as any).rightImage,
        (selectedProduct as any).materialImage
      ].some(img => img && img.trim() !== '')
      
      console.log('🔍 [CentralCanvas] Single product angle images check:', {
        productName: selectedProduct.name,
        hasAngleImages,
        angleImages: {
          front: (selectedProduct as any).frontImage,
          back: (selectedProduct as any).backImage,
          left: (selectedProduct as any).leftImage,
          right: (selectedProduct as any).rightImage,
          material: (selectedProduct as any).materialImage
        }
      })
      
      // Only refresh if we don't have angle images AND we haven't already tried to refresh this product
      if (!hasAngleImages) {
        // Check if we've already attempted to refresh this product
        const refreshKey = `refresh_attempted_${selectedProduct.id}`
        const hasAttemptedRefresh = sessionStorage.getItem(refreshKey)
        
        if (!hasAttemptedRefresh) {
          console.log('🔄 [CentralCanvas] Single product missing angle images, attempting auto-refresh (first attempt)')
          
          // Mark that we've attempted to refresh this product
          sessionStorage.setItem(refreshKey, 'true')
          
          // Small delay to avoid immediate API call
          const timer = setTimeout(() => {
            forceRefreshProductFromAPI()
          }, 1000)
          
          return () => clearTimeout(timer)
        } else {
          console.log('🔄 [CentralCanvas] Already attempted refresh for this product, skipping')
        }
      }
    }
    
    // Cleanup function to clear refresh flags when product changes
    return () => {
      if (selectedProduct?.id) {
        const refreshKey = `refresh_attempted_${selectedProduct.id}`
        sessionStorage.removeItem(refreshKey)
        const forceRefreshKey = `force_refresh_${selectedProduct.id}`
        sessionStorage.removeItem(forceRefreshKey)
        const isRefreshingKey = `is_refreshing_${selectedProduct.id}`
        sessionStorage.removeItem(isRefreshingKey)
      }
    }
  }, [selectedProduct?.id, isClient, forceRefreshProductFromAPI])

  // Expose the force refresh function to window for debugging
  useEffect(() => {
    if (isClient) {
      (window as any).forceRefreshProductFromAPI = forceRefreshProductFromAPI
    }
  }, [isClient, forceRefreshProductFromAPI])

  // Enterprise apps typically log only in development environments
  if (isClient && process.env.NODE_ENV === 'development') {
    console.log('CentralCanvas:', {
      productName: selectedProduct ? (selectedProduct as Product).name : null,
      viewMode,
      hasVariations: selectedProduct ? (selectedProduct as Product).hasVariations : null,
      colorSelected: productColor,
      angles,
      currentVariationImagesCount: currentVariationImages.length,
      currentVariationImages: currentVariationImages.map((img: any) => ({ angle: img.angle, url: img.url })),
      currentImage,
      currentVariation: currentVariation ? {
        id: currentVariation.id,
        color: currentVariation.color?.hex_code,
        imagesCount: currentVariation.images?.length
      } : null,
      hasCurrentDesign: variationDesignPersistence.hasCurrentDesign,
      variationsWithCurrentView: variationDesignPersistence.getVariationsWithCurrentView(),
      // Debug single product design persistence
      singleProductDebug: !(selectedProduct as Product)?.hasVariations ? {
        currentVariationId: variationDesignPersistence.getCurrentVariationId(),
        availableViewModes: variationDesignPersistence.getAvailableViewModes(),
        hasCurrentDesign: variationDesignPersistence.hasCurrentDesign
      } : null
    })
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
      {/* Load saved design component */}
      <LoadSavedDesign onDesignLoaded={handleDesignLoaded} />
      
      {/* Main Canvas Area - Full height with minimal padding */}
      <div className="flex-1 flex items-center justify-center p-2 lg:p-4">
        <div className="relative w-full h-full max-w-4xl max-h-full flex flex-col">
          {/* Main Container - Relative positioning with base/product image */}
          <div className="flex-1 relative bg-white rounded-xl overflow-hidden border border-gray-200/60 shadow-sm min-h-0">
            
            {/* Base/Product Image - Background layer */}
            {selectedProduct && currentImage ? (
              <div className="absolute inset-0 flex items-center justify-center p-4 lg:p-8">
                <div className="w-full h-full relative max-w-2xl max-h-full">
                  <Image
                    src={currentImage}
                    alt={(selectedProduct as Product).name}
                    fill
                    className="object-contain drop-shadow-lg"
                    style={{ 
                      filter: viewMode === "back" ? "brightness(0.85) saturate(1.1)" : "saturate(1.1)",
                      transform: viewMode === "left" ? "rotateY(25deg)" : 
                              viewMode === "right" ? "rotateY(-25deg)" : "none",
                      zIndex: 1
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Show instructions when no product selected */
              <div className="absolute inset-0 flex items-center justify-center p-4 lg:p-8" style={{ zIndex: 1 }}>
                <div className="text-center text-gray-400">
                  <p className="text-xl font-medium mb-2">Start by selecting a product</p>
                  <p className="text-sm text-gray-400 max-w-md">Click the product icon in the left toolbar to browse available products</p>
                </div>
              </div>
            )}

            {/* Sub Container - Contains canvas and all design layers */}
            <div className="absolute inset-0 flex items-center justify-center p-4 lg:p-8" style={{ zIndex: 10 }}>
              <div className="w-full h-full relative max-w-xs max-h-xs">
                
                {/* Canvas Container - Absolutely positioned and centered */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
                  <canvas
                    ref={canvasRef}
                    id="design-canvas"
                    // className="cursor-crosshair bg-transparent transition-all duration-300 ease-in-out"
                    // style={{ 
                    //   border: shouldShowCanvasBorder() 
                    //     ? "2px dashed #3b82f6" 
                    //     : "2px dashed transparent",
                    //   borderRadius: "8px",
                    //   boxShadow: shouldShowCanvasBorder() 
                    //     ? "0 0 0 1px rgba(59, 130, 246, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                    //     : "0 0 0 1px transparent, 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
                    //   backgroundColor: shouldShowCanvasBorder() 
                    //     ? "rgba(255, 255, 255, 0.05)" 
                    //     : "transparent"
                    // }}
                    // width={300}
                    // height={300}
                  />
                </div>

                {/* We don't need to render image layers here anymore since they're handled by Fabric.js canvas */}
              </div>
            </div>
          </div>
          
          {/* Product Angles - Compact design at bottom */}
          {selectedProduct && angles && angles.length > 0 && (
            <div className="flex-shrink-0 mt-3 lg:mt-4">
              <ProductAnglesSelector
                angles={angles}
                selectedAngle={viewMode}
                onSelect={handleViewChange}
                className=""
                productImage={getCurrentImage() || ""}
                variationImages={currentVariationImages}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}