"use client"

import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Truck, Leaf, Palette, ShoppingBag, Shirt } from "lucide-react"
import { setProductColor, setViewMode, setShowProductModal } from "@/lib/redux/designToolSlices/designSlice"
import { RootState } from "@/lib/redux/store"
import Image from "next/image"
import { SizeQuantityModal, SelectedSizeQuantity } from "../modals/size-quantity-modal"

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

export function ProductPanel() {
  const dispatch = useDispatch()
  const { selectedTool, selectedProduct, productColor, viewMode } = useSelector((state: RootState) => state.design)
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<SelectedSizeQuantity[]>([])
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [totalQuantity, setTotalQuantity] = useState<number>(0)

  // If no product is selected, show a message to select a product first
  if (!selectedProduct) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center">
            <Shirt className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Select a Product</h3>
          <p className="text-sm text-gray-400 mb-6">Choose a product from our catalog to start designing</p>
          <Button 
            onClick={() => dispatch(setShowProductModal(true))}
            variant="outline"
            className="border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  const product = selectedProduct as Product;

  const handleColorChange = (color: string) => {
    dispatch(setProductColor(color))
  }

  const handleViewChange = (view: string) => {
    dispatch(setViewMode(view))
  }
  
  // Handle adding selected sizes to cart
  const handleAddToCart = (sizes: SelectedSizeQuantity[]) => {
    setSelectedSizes(sizes)
    
    // Calculate total quantity and price
    const quantity = sizes.reduce((total, item) => total + item.quantity, 0)
    const price = sizes.reduce((total, item) => total + (item.price * item.quantity), 0)
    
    setTotalQuantity(quantity)
    setTotalPrice(price)
  }

  // Get variations from selected product
  const getVariations = () => {
    if (!product.hasVariations || !product.variations) {
      return []
    }
    return product.variations
  }

  // Get current variation based on selected color
  const getCurrentVariation = () => {
    const variations = getVariations()
    if (variations.length === 0) return null
    return variations.find((v: any) => v.color?.hex_code === productColor) || variations[0]
  }

  // Get image for current view mode from current variation
  const getCurrentVariationImage = () => {
    const currentVariation = getCurrentVariation()
    if (!currentVariation) return null
    const imageForAngle = currentVariation.images?.find((img: any) => img.angle === viewMode && img.url)
    return imageForAngle?.url || product.image
  }

  const variations = getVariations()

  // Get current variation price or fallback to product price
  const getCurrentPrice = () => {
    const currentVariation = getCurrentVariation()
    if (currentVariation && currentVariation.price !== undefined && currentVariation.price !== null) {
      return currentVariation.price
    }
    return product.price
  }

  const parsePriceToNumber = (value: unknown): number => {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const cleaned = value.replace(/[^\d.-]/g, "")
      const num = parseFloat(cleaned)
      return isNaN(num) ? 0 : num
    }
    return 0
  }

  // Format price without decimals, just "888 kr"
  const formatPrice = (amount: number) => {
    return `${Math.round(amount)} kr`
  }

  const currentPrice = getCurrentPrice()
  const displayPrice = formatPrice(parsePriceToNumber(currentPrice))

  return (
    <div className="flex flex-col h-full p-4 lg:p-6">
      <div className="space-y-4 lg:space-y-6">
        {/* Product Header */}
        <div className="space-y-3">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">{product.name}</h2>
          <div className="flex items-center space-x-2 mb-3">
            <Leaf className="w-4 h-4 text-green-600" />
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              Eco-friendly
            </Badge>
          </div>
          <div className="text-2xl font-bold text-purple-600">{displayPrice}</div>
        </div>

        {/* Color Variations - show only if real variations exist */}
        {variations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Color Variations</span>
            </div>
            
            <div className="grid grid-cols-6 gap-3">
              {variations.map((variation: any, index: number) => {
                const isSelected = productColor === variation.color.hex_code
                
                return (
                  <button
                    key={variation.id}
                    className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                      isSelected 
                        ? "border-sky-500 ring-2 ring-sky-200 scale-110 shadow-lg" 
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: variation.color.hex_code }}
                    onClick={() => handleColorChange(variation.color.hex_code)}
                    title={variation.color.name || `Color ${index + 1}`}
                  >
                    {isSelected && (
                      <div className="flex items-center justify-center w-full h-full">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* No fake/dummy color swatches for non-variation products */}

        {/* Delivery Info */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
          <Truck className="w-4 h-4 text-purple-600" />
          <span>Free delivery: 5-7 business days</span>
        </div>

        {/* Size & Quantity Summary (shows when sizes are selected) */}
        {totalQuantity > 0 && (
          <div className="bg-purple-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-800">Selected Items:</span>
              <span className="text-sm font-bold text-purple-800">{totalQuantity}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-800">Total Price:</span>
              <span className="text-lg font-bold text-purple-600">{totalPrice} kr</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {selectedSizes.filter(s => s.quantity > 0).map((size) => (
                <Badge key={size.size} variant="outline" className="bg-white border border-purple-200 text-xs py-1 px-2 flex justify-between items-center">
                  <span>{size.size}</span>
                  <span className="font-bold ml-1">×{size.quantity}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          onClick={() => setIsSizeModalOpen(true)}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          {totalQuantity > 0 ? 'Update Size & Quantity' : 'Choose Size & Quantity'}
        </Button>
        
        {/* Size & Quantity Modal */}
        <SizeQuantityModal 
          open={isSizeModalOpen} 
          onOpenChange={setIsSizeModalOpen}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  )
}