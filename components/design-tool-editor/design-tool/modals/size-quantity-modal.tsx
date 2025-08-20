"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { addToCartWithSizes } from "@/lib/redux/slices/cartSlice"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Minus, Plus, ShoppingCart, ChevronRight, AlertTriangle, Info } from "lucide-react"
import { RootState } from "@/lib/redux/store"
import { SizePrice } from "@/lib/models/Product"
import { composeProductAndDesign } from "@/lib/utils/imageCompose"
import { calculateDesignElementCosts, formatDesignPrice } from "@/lib/utils/designPricing"

interface SizeQuantityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart?: (selectedSizes: SelectedSizeQuantity[]) => void
}

export interface SelectedSizeQuantity {
  size: string
  quantity: number
  price: number
}

export function SizeQuantityModal({ open, onOpenChange, onAddToCart }: SizeQuantityModalProps) {
  const dispatch = useDispatch()
  const { selectedProduct, productColor, viewMode, selectedTemplate } = useSelector((state: RootState) => state.design)
  const { fabricCanvas } = useSelector((state: RootState) => state.canvas)
  
  // State for selected sizes and quantities
  const [selectedSizes, setSelectedSizes] = useState<SelectedSizeQuantity[]>([])
  const [basePrice, setBasePrice] = useState<number>(0)
  const [availableSizes, setAvailableSizes] = useState<SizePrice[]>([])
  const [designCosts, setDesignCosts] = useState<any>(null)
  const [quantityError, setQuantityError] = useState<string>("")
  
  // Get current variation based on selected color
  const getCurrentVariation = () => {
    if (!selectedProduct) return null
    
    // If product has variations, find the variation that matches the current color
    if ((selectedProduct as any).hasVariations && (selectedProduct as any).variations) {
      const variations = (selectedProduct as any).variations
      
      // First try to find variation by exact color match
      let variation = variations.find((v: any) => v.color.hex_code === productColor)
      
      // If no exact match, try to find by color name
      if (!variation) {
        variation = variations.find((v: any) => v.color.name === productColor)
      }
      
      // If still no match, use the first variation
      if (!variation) {
        variation = variations[0]
      }
      
      console.log('🛒 [SizeQuantityModal] getCurrentVariation result:', {
        productColor,
        foundVariation: variation,
        allVariations: variations.map((v: any) => ({ id: v.id, color: v.color?.hex_code, price: v.price }))
      })
      
      return variation
    } else {
      // For single products without variations, create a virtual variation
      const individualImages = []
      
      if ((selectedProduct as any).frontImage && (selectedProduct as any).frontImage.trim() !== '') {
        individualImages.push({
          id: 'front_img',
          url: (selectedProduct as any).frontImage,
          alt_text: (selectedProduct as any).frontAltText || '',
          angle: 'front',
          is_primary: true
        })
      }
      
      if ((selectedProduct as any).backImage && (selectedProduct as any).backImage.trim() !== '') {
        individualImages.push({
          id: 'back_img',
          url: (selectedProduct as any).backImage,
          alt_text: (selectedProduct as any).backAltText || '',
          angle: 'back',
          is_primary: false
        })
      }
      
      if ((selectedProduct as any).leftImage && (selectedProduct as any).leftImage.trim() !== '') {
        individualImages.push({
          id: 'left_img',
          url: (selectedProduct as any).leftImage,
          alt_text: (selectedProduct as any).leftAltText || '',
          angle: 'left',
          is_primary: false
        })
      }
      
      if ((selectedProduct as any).rightImage && (selectedProduct as any).rightImage.trim() !== '') {
        individualImages.push({
          id: 'right_img',
          url: (selectedProduct as any).rightImage,
          alt_text: (selectedProduct as any).rightAltText || '',
          angle: 'right',
          is_primary: false
        })
      }
      
      if ((selectedProduct as any).materialImage && (selectedProduct as any).materialImage.trim() !== '') {
        individualImages.push({
          id: 'material_img',
          url: (selectedProduct as any).materialImage,
          alt_text: (selectedProduct as any).materialAltText || '',
          angle: 'material',
          is_primary: false
        })
      }
      
      if (individualImages.length > 0) {
        const virtualVariation = {
          id: 'single_product_variation',
          color: { 
            name: 'Default', 
            hex_code: (selectedProduct as any).baseColor || '#000000', 
            swatch_image: selectedProduct.image 
          },
          images: individualImages,
          price: selectedProduct.price,
          inStock: (selectedProduct as any).inStock || true,
          stockQuantity: 0,
          isDefault: true
        }
        
        console.log('🛒 [SizeQuantityModal] Created virtual variation for single product:', {
          productName: selectedProduct.name,
          hasVariations: (selectedProduct as any).hasVariations,
          individualImagesCount: individualImages.length,
          virtualVariation
        })
        
        return virtualVariation
      }
    }
    
      return null
    }
  
  // Get purchase limits for the current product
  const getPurchaseLimits = () => {
    if (!selectedProduct?.purchaseLimit?.enabled) return null
    return selectedProduct.purchaseLimit
  }
  
  // Validate current variation and price
  const validateCurrentVariation = () => {
    const currentVariation = getCurrentVariation()
    if (!currentVariation) {
      return false
    }
    
    // For single products, check if the product itself has a valid price
    if ((selectedProduct as any).hasVariations) {
      // For variation products, check variation price
      if (currentVariation.price === undefined || currentVariation.price === null) {
        return false
      }
    } else {
      // For single products, check main product price
      if (selectedProduct.price === undefined || selectedProduct.price === null) {
        return false
      }
    }
    
    return true
  }
  
  // Initialize available sizes and base price when modal opens or product changes
  useEffect(() => {
    if (open && selectedProduct) {
      console.log('🛒 [SizeQuantityModal] Initializing modal with product:', {
        productName: selectedProduct.name,
        hasVariations: (selectedProduct as any).hasVariations,
        productPrice: selectedProduct.price,
        productColor,
        viewMode,
        // Debug single product data
        singleProductData: !(selectedProduct as any).hasVariations ? {
          frontImage: !!(selectedProduct as any).frontImage,
          backImage: !!(selectedProduct as any).backImage,
          leftImage: !!(selectedProduct as any).leftImage,
          rightImage: !!(selectedProduct as any).rightImage,
          materialImage: !!(selectedProduct as any).materialImage,
          angles: (selectedProduct as any).angles
        } : null
      })
      
      const currentVariation = getCurrentVariation()
      
      // For single products, we can proceed even without a variation
      // For variation products, we need a valid variation
      if ((selectedProduct as any).hasVariations && !currentVariation) {
        console.log('🛒 [SizeQuantityModal] No valid variation found for product with variations')
        return
      }
      
      // Get the actual product price from the current variation or product
      let productBasePrice = 0
      
      if ((selectedProduct as any).hasVariations && currentVariation) {
        // For variation products, use the existing logic
        // Priority 1: Use main product price if it's significantly higher than variation price
        if (selectedProduct.price !== undefined && selectedProduct.price !== null) {
          const mainProductPrice = Number(selectedProduct.price)
          const variationPrice = currentVariation.price !== undefined ? Number(currentVariation.price) : 0
          
          // If main product price is significantly higher, use it instead of variation price
          if (mainProductPrice > variationPrice * 10) {
            productBasePrice = mainProductPrice
          } else if (variationPrice > 0) {
            productBasePrice = variationPrice
          } else {
            productBasePrice = mainProductPrice
          }
        } 
        // Priority 2: Use variation price if available (fallback)
        else if (currentVariation && currentVariation.price !== undefined && currentVariation.price !== null) {
          productBasePrice = Number(currentVariation.price)
        } 
        // Priority 3: Check if there's a price in the variations array
        else if (selectedProduct.variations && selectedProduct.variations.length > 0) {
          const firstVariationWithPrice = selectedProduct.variations.find((v: any) => 
            v.price !== undefined && v.price !== null && v.price > 1 // Exclude obviously incorrect prices like 1 kr
          )
          if (firstVariationWithPrice) {
            productBasePrice = Number(firstVariationWithPrice.price)
          }
        }
      } else {
        // For single products, use the main product price
        if (selectedProduct.price !== undefined && selectedProduct.price !== null) {
          // Handle case where price might be a string like "888 kr"
          let rawPrice = selectedProduct.price
          if (typeof rawPrice === 'string') {
            // Extract numeric value from price string
            const numericMatch = rawPrice.match(/(\d+(?:[.,]\d+)?)/)
            if (numericMatch) {
              rawPrice = parseFloat(numericMatch[1].replace(',', '.'))
            } else {
              rawPrice = 0
            }
          }
          productBasePrice = Number(rawPrice)
          
          console.log('🛒 [SizeQuantityModal] Single product price parsing:', {
            originalPrice: selectedProduct.price,
            rawPrice,
            parsedPrice: productBasePrice
          })
        }
      }
      
      console.log('🛒 [SizeQuantityModal] Price calculation result:', {
        hasVariations: (selectedProduct as any).hasVariations,
        currentVariation: currentVariation ? { id: currentVariation.id, price: currentVariation.price } : null,
        mainProductPrice: selectedProduct.price,
        mainProductPriceType: typeof selectedProduct.price,
        calculatedBasePrice: productBasePrice
      })
      
      setBasePrice(productBasePrice)
      
      // Create size options with actual pricing
      const sizeOptions = [
        { size: "XS", price: 0, inStock: true, stockQuantity: 100 },
        { size: "S", price: 0, inStock: true, stockQuantity: 100 },
        { size: "M", price: 0, inStock: true, stockQuantity: 100 },
        { size: "L", price: 0, inStock: true, stockQuantity: 100 },
        { size: "XL", price: 0, inStock: true, stockQuantity: 100 },
        { size: "XXL", price: 5, inStock: true, stockQuantity: 50 },
        { size: "3XL", price: 10, inStock: true, stockQuantity: 25 },
        { size: "4XL", price: 15, inStock: true, stockQuantity: 15 },
        { size: "5XL", price: 20, inStock: true, stockQuantity: 10 },
      ]
      
      // Calculate actual prices for each size
      const sizePrices = sizeOptions.map(size => ({
        ...size,
        price: productBasePrice + size.price, // Base price + size premium
        useBasePrice: false
      }))
      
      setAvailableSizes(sizePrices)
      
      console.log('🛒 [SizeQuantityModal] Size initialization:', {
        sizeOptions: sizeOptions.length,
        sizePrices: sizePrices.length,
        basePrice: productBasePrice,
        firstSizePrice: sizePrices[0]?.price,
        lastSizePrice: sizePrices[sizePrices.length - 1]?.price
      })
      
      // Initialize with empty quantities
      setSelectedSizes(
        sizePrices.map(size => ({
          size: size.size,
          quantity: 0,
          price: size.price
        }))
      )
      
      // Calculate design element costs
      if (selectedTemplate || fabricCanvas) {
        const costs = calculateDesignElementCosts(selectedTemplate, fabricCanvas)
        setDesignCosts(costs)
      }
    }
  }, [open, selectedProduct, productColor, selectedTemplate, fabricCanvas])
  
  // Update quantity for a specific size
  const updateQuantity = (sizeIndex: number, newQuantity: number) => {
    // Ensure quantity is not negative
    const validQuantity = Math.max(0, newQuantity)
    
    // Check purchase limits
    const purchaseLimits = getPurchaseLimits()
    if (purchaseLimits) {
      const totalQuantity = calculateTotalQuantity() - selectedSizes[sizeIndex].quantity + validQuantity
      
      if (totalQuantity > purchaseLimits.maxQuantityPerOrder) {
        setQuantityError(
          purchaseLimits.message || 
          `Maximum quantity per order is ${purchaseLimits.maxQuantityPerOrder}. Please reduce your order.`
        )
        return
      }
    }
    
    // Clear any previous errors
    setQuantityError("")
    
    setSelectedSizes(prev => {
      const updated = [...prev]
      updated[sizeIndex] = {
        ...updated[sizeIndex],
        quantity: validQuantity
      }
      return updated
    })
  }
  
  // Calculate total price including design costs
  const calculateTotal = () => {
    const baseTotal = selectedSizes.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
    
    // Add design costs if any
    const designCost = designCosts ? designCosts.totalCost * calculateTotalQuantity() : 0
    
    return baseTotal + designCost
  }
  
  // Calculate total quantity
  const calculateTotalQuantity = () => {
    return selectedSizes.reduce((total, item) => total + item.quantity, 0)
  }
  
  // Check if quantity increase is allowed
  const canIncreaseQuantity = (sizeIndex: number) => {
    const purchaseLimits = getPurchaseLimits()
    if (!purchaseLimits) return true
    
    const currentTotal = calculateTotalQuantity()
    const currentSizeQuantity = selectedSizes[sizeIndex]?.quantity || 0
    
    // Check if adding one more would exceed order limit
    if (currentTotal - currentSizeQuantity + (currentSizeQuantity + 1) > purchaseLimits.maxQuantityPerOrder) {
      return false
    }
    
    return true
  }
  
  // Create composite preview using reusable util
  const createCompositePreview = async (canvas: HTMLCanvasElement, product: any): Promise<string> => {
    // Determine base product image for current state
    const getProductImageUrl = () => {
      if (!product) return null
      
      if (product.hasVariations && product.variations) {
        // For variation products, use the existing logic
        const currentVariation = product.variations.find((v: any) => v.color.hex_code === productColor)
        if (currentVariation) {
          const imageForAngle = currentVariation.images?.find((img: any) => img.angle === viewMode && img.url)
          if (imageForAngle) return imageForAngle.url
          const frontImage = currentVariation.images?.find((img: any) => img.angle === "front" && img.url)
          if (frontImage) return frontImage.url
          return currentVariation.color.swatch_image || product.image
        }
      } else {
        // For single products, check individual angle images
        const angleImageMap: Record<string, string> = {
          'front': (product as any).frontImage,
          'back': (product as any).backImage,
          'left': (product as any).leftImage,
          'right': (product as any).rightImage,
          'material': (product as any).materialImage
        }
        
        const currentAngleImage = angleImageMap[viewMode]
        if (currentAngleImage && currentAngleImage.trim() !== '') {
          return currentAngleImage
        }
        
        // Fallback to main product image
        return product.image
      }
      
      return product.image
    }

    const base = getProductImageUrl()
    try {
      const overlay = canvas.toDataURL('image/png')
      if (!base) return overlay
      return await composeProductAndDesign({ productImageUrl: base, overlayImageUrl: overlay, targetWidth: 1200, overlayScale: 0.6 })
    } catch {
      return canvas.toDataURL('image/png')
    }
  }

  // Handle add to cart
  const handleAddToCart = async () => {
    // Filter out sizes with quantity 0
    const sizesToAdd = selectedSizes.filter(item => item.quantity > 0)
    
    if (sizesToAdd.length === 0) {
      // Show error or notification that no sizes selected
      return
    }
    
    // Get the current variation to ensure we're adding the correct variant
    const currentVariation = getCurrentVariation()
    if (!currentVariation) {
      return
    }
    
    // Get all designed angles for the current variation from the design persistence system
    const getAllDesignedAngles = () => {
      if (!selectedProduct) return []
      
      // Get the current variation ID
      let currentVariationId: string
      if ((selectedProduct as any).hasVariations && (selectedProduct as any).variations) {
        const variation = (selectedProduct as any).variations.find((v: any) => v.color.hex_code === productColor)
        currentVariationId = variation?.id || null
      } else {
        // For single products, create virtual variation ID
        currentVariationId = `single_${selectedProduct.id}_${viewMode}`
      }
      
      if (!currentVariationId) return []
      
      // Get available view modes
      const availableViewModes: string[] = []
      if ((selectedProduct as any).hasVariations && (selectedProduct as any).variations) {
        const firstVariation = (selectedProduct as any).variations[0]
        if (firstVariation?.images) {
          firstVariation.images
            .filter((img: any) => img.angle && img.url && img.url.trim() !== '')
            .forEach((img: any) => availableViewModes.push(img.angle))
        }
      } else {
        const angleFields = ['front', 'back', 'left', 'right', 'material']
        angleFields.forEach(angle => {
          const imageField = `${angle}Image`
          if ((selectedProduct as any)[imageField] && (selectedProduct as any)[imageField].trim() !== '') {
            availableViewModes.push(angle)
          }
        })
      }
      
      // Check which angles have designs by looking at the design persistence system
      const designedAngles: Array<{ angle: string; hasDesign: boolean; designData?: any }> = []
      
      availableViewModes.forEach((angle: string) => {
        // Check if this angle has a design by looking at the actual design persistence system
        // We need to check if there's a saved design for this specific angle
        let hasDesign = false
        let designData = null
        
        if (angle === viewMode) {
          // Current view always has design if we're in the design tool
          hasDesign = true
          // For current view, get the canvas data from the current fabric canvas
          const fabricCanvas = (window as any).fabricCanvas
          if (fabricCanvas) {
            const currentCanvasJSON = fabricCanvas.toJSON(['isTemplate','minFontSize','maxFontSize','_originalFontSize','_bendAmount'])
            designData = { 
              viewMode: angle, 
              productColor,
              canvasJSON: currentCanvasJSON,
              lastModified: Date.now()
            }
          } else {
            designData = { viewMode: angle, productColor }
          }
        } else {
          // For other angles, check if they have designs in the persistence system
          // We'll check the localStorage for saved designs
          try {
            const storageKey = `variationDesigns`
            const storedDesigns = localStorage.getItem(storageKey)
            if (storedDesigns) {
              const designs = JSON.parse(storedDesigns)
              // Check if there's a design for this specific angle
              const angleDesign = designs.find((d: any) => {
                if ((selectedProduct as any).hasVariations && (selectedProduct as any).variations) {
                  // For variation products, check variation ID and angle
                  const variation = (selectedProduct as any).variations.find((v: any) => v.color.hex_code === productColor)
                  return d.variationId === variation?.id && d.viewMode === angle
                } else {
                  // For single products, check virtual variation ID and angle
                  const virtualVariationId = `single_${selectedProduct.id}_${angle}`
                  return d.variationId === virtualVariationId
                }
              })
              
              if (angleDesign) {
                hasDesign = true
                designData = { 
                  viewMode: angle, 
                  productColor,
                  canvasJSON: angleDesign.canvasJSON,
                  lastModified: angleDesign.lastModified
                }
              }
            }
          } catch (error) {
            console.warn('Error checking design persistence for angle:', angle, error)
          }
        }
        
        designedAngles.push({
          angle: angle,
          hasDesign,
          designData
        })
      })
      
      console.log('🔄 [SizeQuantityModal] All designed angles for variation:', {
        variationId: currentVariationId,
        availableViewModes,
        designedAngles: designedAngles.map(d => ({ 
          angle: d.angle, 
          hasDesign: d.hasDesign,
          hasCanvasData: !!d.designData?.canvasJSON,
          canvasDataSize: d.designData?.canvasJSON ? JSON.stringify(d.designData.canvasJSON).length : 0
        }))
      })
      
      return designedAngles
    }
    
    const allDesignedAngles = getAllDesignedAngles()
    
    // Log the data being moved to cart
    console.log('🛒 [SizeQuantityModal] Adding to cart with data:', {
      product: {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        hasVariations: (selectedProduct as any).hasVariations,
        type: typeof selectedProduct.price
      },
      selectedSizes: sizesToAdd.map(size => ({
        size: size.size,
        quantity: size.quantity,
        price: size.price,
        totalPrice: size.price * size.quantity
      })),
      currentVariation: {
        id: currentVariation.id,
        color: currentVariation.color,
        price: currentVariation.price,
        imagesCount: currentVariation.images?.length
      },
      allDesignedAngles: allDesignedAngles.map(d => ({ 
        angle: d.angle, 
        hasDesign: d.hasDesign,
        hasCanvasData: !!d.designData?.canvasJSON,
        designData: d.designData
      })),
      designContext: {
        viewMode,
        productColor,
        selectedTemplate: selectedTemplate ? {
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          price: selectedTemplate.price
        } : null,
        designCosts,
        allDesignedAngles: allDesignedAngles.map(angle => ({
          angle: angle.angle,
          hasDesign: angle.hasDesign,
          designData: angle.designData,
          canvasJSON: angle.designData?.canvasJSON || null
        }))
      },
      totals: {
        totalQuantity: sizesToAdd.reduce((sum, size) => sum + size.quantity, 0),
        totalPrice: sizesToAdd.reduce((sum, size) => sum + (size.price * size.quantity), 0),
        designCosts: designCosts?.totalCost || 0
      }
    })
    
    // Get canvas and create composite preview
    const canvas = document.getElementById('design-canvas') as HTMLCanvasElement
    const designPreview = canvas ? await createCompositePreview(canvas, selectedProduct) : undefined
    
    // Get the selected variation details for the current variant only
    const getSelectedVariationDetails = () => {
      if (!currentVariation) return null
      
      return {
        variationId: currentVariation.id,
        colorName: currentVariation.color?.name || 'Unknown',
        colorHexCode: currentVariation.color?.hex_code || productColor,
        colorSwatchImage: currentVariation.color?.swatch_image,
        variationPrice: currentVariation.price,
        variationImages: currentVariation.images,
        allDesignedAngles: allDesignedAngles.map(angle => ({
          angle: angle.angle,
          hasDesign: angle.hasDesign,
          designData: angle.designData,
          // Include canvas JSON if available for this angle
          canvasJSON: angle.designData?.canvasJSON || null
        }))
      }
    }

    const selectedVariationDetails = getSelectedVariationDetails()

    // Create enhanced product with complete context for the current variant only
    const productWithContext = {
      ...selectedProduct,
      // Override with current variation data to ensure correct variant
      id: currentVariation.id || selectedProduct.id,
      price: currentVariation.price || selectedProduct.price,
      // Add design context
      designContext: {
        viewMode: viewMode,
        productColor: productColor,
        selectedVariation: selectedVariationDetails,
        selectedTemplate: selectedTemplate ? {
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          category: selectedTemplate.category,
          image: selectedTemplate.image,
          price: selectedTemplate.price,
        } : null,
        designCosts: designCosts, // Include design costs in context
        allDesignedAngles: allDesignedAngles.map(angle => ({
          angle: angle.angle,
          hasDesign: angle.hasDesign,
          designData: angle.designData,
          canvasJSON: angle.designData?.canvasJSON || null,
          lastModified: angle.designData?.lastModified || null
        }))
      }
    }
    
    // Collect canvas JSON if available for precise reproduction
    const fabricCanvas = (window as any).fabricCanvas
    const designCanvasJSON = fabricCanvas ? fabricCanvas.toJSON(['isTemplate','minFontSize','maxFontSize','_originalFontSize','_bendAmount']) : undefined

    // Get the current view's canvas data from allDesignedAngles
    const currentViewDesign = allDesignedAngles.find(angle => angle.angle === viewMode)
    const currentViewCanvasJSON = currentViewDesign?.designData?.canvasJSON || designCanvasJSON

    // Create the complete design context for cart
    const completeDesignContext = {
      viewMode: viewMode,
      productColor: productColor,
      selectedVariation: selectedVariationDetails,
      selectedTemplate: selectedTemplate ? {
        id: selectedTemplate.id,
        name: selectedTemplate.name,
        category: selectedTemplate.category,
        image: selectedTemplate.image,
        price: selectedTemplate.price,
      } : null,
      designCosts: designCosts,
      allDesignedAngles: allDesignedAngles.map(angle => ({
        angle: angle.angle,
        hasDesign: angle.hasDesign,
        designData: angle.designData,
        canvasJSON: angle.designData?.canvasJSON || null,
        lastModified: angle.designData?.lastModified || null
      }))
    }

    // Dispatch action to add to cart with sizes and complete product context
    dispatch(addToCartWithSizes({
      product: { ...productWithContext },
      selectedSizes: sizesToAdd,
      designPreview,
      designCanvasJSON: currentViewCanvasJSON, // Use the current view's canvas data
      designContext: completeDesignContext, // Pass the complete design context
      // If we have a saved design, we could include its ID here
      // designId: savedDesignId
    }))
    
    // Also call the callback if provided
    if (onAddToCart) {
      onAddToCart(sizesToAdd)
    }
    
    // Close the modal
    onOpenChange(false)
  }
  
  // Format price with currency
  const formatPrice = (price: number) => {
    return `${Math.round(price)} kr`
  }
  
  const purchaseLimits = getPurchaseLimits()
  
  return (
 
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl h-full  overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Select Size & Quantity
            {purchaseLimits && (
              <span className="block text-sm font-normal text-gray-600 mt-1">
                Order Limit: Maximum {purchaseLimits.maxQuantityPerOrder} items per order
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* Product Info Display */}
        {selectedProduct && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {selectedProduct.image && (
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-sm font-medium text-blue-600">
                  Base Price: {formatPrice(basePrice)}
                </p>
              </div>
            </div>
          </div>
        )}
        
      
        
        {/* Design Costs Display */}
        {designCosts && designCosts.totalCost > 0 && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Design Elements:</strong> {designCosts.breakdown.template.name} ({formatDesignPrice(designCosts.breakdown.template.cost)})
              {designCosts.breakdown.elements.length > 0 && (
                <span> + {designCosts.breakdown.elements.length} premium elements</span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Quantity Error Display */}
        {quantityError && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {quantityError}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="max-h-[60vh] overflow-y-auto pr-1">
        
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Size</TableHead>
                <TableHead className="w-1/3 text-right">Price</TableHead>
                <TableHead className="w-1/3 text-center">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedSizes.map((sizeItem, index) => {
                const stockInfo = availableSizes[index]
                const isOutOfStock = !stockInfo?.inStock || stockInfo?.stockQuantity <= 0
                const canIncrease = canIncreaseQuantity(index)
                
                return (
                  <TableRow key={sizeItem.size} className={isOutOfStock ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{sizeItem.size}</TableCell>
                    <TableCell className="text-right">{formatPrice(sizeItem.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-md"
                          onClick={() => updateQuantity(index, sizeItem.quantity - 1)}
                          disabled={sizeItem.quantity <= 0 || isOutOfStock}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={sizeItem.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-12 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="0"
                          max={stockInfo?.stockQuantity || 999}
                          disabled={isOutOfStock}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-md"
                          onClick={() => updateQuantity(index, sizeItem.quantity + 1)}
                          disabled={isOutOfStock || !canIncrease || (stockInfo && sizeItem.quantity >= stockInfo.stockQuantity)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {isOutOfStock && (
                        <div className="text-xs text-red-500 text-center mt-1">Out of stock</div>
                      )}
                      {!canIncrease && sizeItem.quantity > 0 && (
                        <div className="text-xs text-orange-500 text-center mt-1">Limit reached</div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Quantity:</span>
            <span className="font-medium">{calculateTotalQuantity()} items</span>
          </div>
          
          {/* Design Costs Breakdown */}
          {designCosts && designCosts.totalCost > 0 && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Base Product Cost:</span>
                <span className="font-medium">
                  {formatPrice(selectedSizes.reduce((total, item) => total + (item.price * item.quantity), 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Design Elements ({calculateTotalQuantity()} × {formatDesignPrice(designCosts.totalCost)}):</span>
                <span className="font-medium">
                  {formatPrice(designCosts.totalCost * calculateTotalQuantity())}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-900 font-medium">Total Price:</span>
            <span className="text-lg font-bold text-blue-600">{formatPrice(calculateTotal())}</span>
          </div>
        </div>
        
        <DialogFooter className="flex sm:justify-between gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="flex-1">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleAddToCart} 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={calculateTotalQuantity() === 0 || !!quantityError}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    
  )
}