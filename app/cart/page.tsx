"use client"

import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { useMemo } from "react"
import { updateQuantity, removeFromCart } from "@/lib/redux/slices/cartSlice"
import { translations } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Plus, Minus, Trash2, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { items: cart } = useAppSelector((state) => state.cart)
  const { language } = useAppSelector((state) => state.app)
  const t = translations[language]
  const activeCoupon = useAppSelector((s: any) => s.coupons.activeCoupon)

  const rawSubtotal = cart.reduce((total, item) => {
    let itemPrice = 0;
    
    // Handle different price formats
    if (typeof item.price === 'number') {
      itemPrice = item.price;
            } else if (typeof item.price === 'string') {
          // Remove any non-numeric characters except decimal point
          const cleanPrice = String(item.price).replace(/[^\d.-]/g, '');
          itemPrice = parseFloat(cleanPrice) || 0;
    } else if (item.selectedSizes && item.selectedSizes.length > 0) {
      // If we have selectedSizes, calculate from those
      itemPrice = item.selectedSizes.reduce((sum, size) => sum + (size.price * size.quantity), 0) / item.quantity;
    }
    
    return total + (itemPrice * item.quantity);
  }, 0)
  // Compute discount from active percentage coupon across eligible items
  const discountAmount = useMemo(() => {
    if (!activeCoupon || activeCoupon.discountType !== "percentage") return 0
    const eligibleTotal = cart.reduce((sum, item) => {
      const eligible = (item as any).eligibleForCoupons === true
      if (!eligible) return sum
      let price = 0
      if (typeof item.price === 'number') price = item.price
      else if (typeof item.price === 'string') price = parseFloat(String(item.price).replace(/[^\d.-]/g, '')) || 0
      else if (item.selectedSizes && item.selectedSizes.length > 0) {
        price = item.selectedSizes.reduce((s, sz) => s + (sz.price * sz.quantity), 0) / item.quantity
      }
      return sum + price * item.quantity
    }, 0)
    return (eligibleTotal * activeCoupon.discountValue) / 100
  }, [cart, activeCoupon])

  const subtotal = Math.max(0, rawSubtotal - discountAmount)
  const vatAmount = subtotal * 0.25
  const cartTotal = subtotal + vatAmount

  const handleUpdateQuantity = (id: string, quantity: number) => {
    // Ensure quantity does not go below 1
    dispatch(updateQuantity({ id, quantity: Math.max(1, quantity) }))
  }

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromCart(id))
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-12 flex flex-col items-center justify-center min-h-[calc(100vh-250px)]">
        <ShoppingCart className="mx-auto h-20 w-20 text-slate-400 dark:text-slate-500 mb-6" />
        <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">{t.cart}</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">{t.yourCartIsEmpty}</p>
        <Button 
          size="lg" 
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          onClick={() => router.push('/products')}
        >
          <span className="flex items-center">{t.browseProducts}</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center text-slate-900 dark:text-white">{t.cart}</h1>
      <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                  <TableHead className="w-2/5 text-slate-700 dark:text-slate-300">{t.products}</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">{t.price}</TableHead>
                  <TableHead className="text-center w-1/5 text-slate-700 dark:text-slate-300">{t.quantity}</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-300">{t.total}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item, index) => {
                  // Get the correct product image based on design context
                  const getProductDisplayImage = () => {
                    // If we have a design preview from the design tool, use that
                    if (item.designPreview) {
                      return item.designPreview
                    }
                    
                    // If we have design context with variation info, use the specific variation image
                    if ((item as any).designContext?.selectedVariation) {
                      const variation = (item as any).designContext.selectedVariation
                      const viewMode = (item as any).designContext.viewMode || "front"
                      
                      // Find image for the specific angle
                      const imageForAngle = variation.variationImages?.find((img: any) => 
                        img.angle === viewMode && img.url
                      )
                      if (imageForAngle) {
                        return imageForAngle.url
                      }
                      
                      // Fallback to front view
                      const frontImage = variation.variationImages?.find((img: any) => 
                        img.angle === "front" && img.url
                      )
                      if (frontImage) {
                        return frontImage.url
                      }
                      
                      // Fallback to swatch image
                      if (variation.colorSwatchImage) {
                        return variation.colorSwatchImage
                      }
                    }
                    
                    // Ultimate fallback to default product image
                    return item.image || "/placeholder.svg"
                  }

                  // Get product display name with variation info
                  const getProductDisplayName = () => {
                    let displayName = item.name
                    
                    // Add variation color info if available
                    if ((item as any).designContext?.selectedVariation) {
                      const variation = (item as any).designContext.selectedVariation
                      displayName += ` (${variation.colorName})`
                    }
                    
                    return displayName
                  }

                  // Get selected sizes description
                  const getSelectedSizesDescription = () => {
                    if (!item.selectedSizes || item.selectedSizes.length === 0) {
                      return null
                    }
                    
                    // Filter out sizes with 0 quantity
                    const activeSizes = item.selectedSizes.filter(size => size.quantity > 0)
                    
                    if (activeSizes.length === 0) {
                      return null
                    }
                    
                    // Create a readable description
                    const sizeDescriptions = activeSizes.map(size => 
                      `${size.size}: ${size.quantity}`
                    )
                    
                    return `Sizes: ${sizeDescriptions.join(', ')}`
                  }

                  // Get price breakdown for items with selected sizes
                  const getPriceBreakdown = () => {
                    if (!item.selectedSizes || item.selectedSizes.length === 0) {
                      return null
                    }
                    
                    const activeSizes = item.selectedSizes.filter(size => size.quantity > 0)
                    if (activeSizes.length === 0) {
                      return null
                    }
                    
                    const totalPrice = activeSizes.reduce((sum, size) => sum + (size.price * size.quantity), 0)
                    const averagePrice = totalPrice / activeSizes.reduce((sum, size) => sum + size.quantity, 0)
                    
                    return `Avg: ${averagePrice.toFixed(2)} kr per item`
                  }

                  return (
                    <TableRow
                      key={item.id}
                      className={`${
                        index % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/20"
                      } border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors`}
                    >
                      <TableCell className="font-medium flex items-center gap-3 py-4">
                        <div className="relative">
                          <Image
                            src={getProductDisplayImage()}
                            alt={getProductDisplayName()}
                            width={80}
                            height={60}
                            className="rounded-md object-cover border border-slate-200 dark:border-slate-700"
                          />
                          {/* Show a design indicator if this is a custom design */}
                          {item.designPreview && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              ✨
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-900 dark:text-white">{getProductDisplayName()}</span>
                          {/* Show design context info */}
                          {(item as any).designContext && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {(item as any).designContext.viewMode && (
                                <span className="mr-2">View: {(item as any).designContext.viewMode}</span>
                              )}
                              {(item as any).designContext.selectedTemplate && (
                                <span>Template: {(item as any).designContext.selectedTemplate.name}</span>
                              )}
                            </div>
                          )}
                          {/* Show selected sizes description */}
                          {getSelectedSizesDescription() && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {getSelectedSizesDescription()}
                            </div>
                          )}
                          {/* Show price breakdown for items with selected sizes */}
                          {getPriceBreakdown() && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {getPriceBreakdown()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {(() => {
                        let displayPrice;
                        if (typeof item.price === 'number') {
                          displayPrice = item.price.toFixed(2);
                        } else if (typeof item.price === 'string') {
                          const cleanPrice = String(item.price).replace(/[^\d.-]/g, '');
                          displayPrice = (parseFloat(cleanPrice) || 0).toFixed(2);
                        } else if (item.selectedSizes && item.selectedSizes.length > 0) {
                          // Calculate average price per item from selected sizes
                          const totalPrice = item.selectedSizes.reduce((sum, size) => sum + (size.price * size.quantity), 0);
                          displayPrice = (totalPrice / item.quantity).toFixed(2);
                        } else {
                          displayPrice = "0.00";
                        }
                        return `${displayPrice} SEK`;
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-transparent border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, Number.parseInt(e.target.value) || 0)}
                          className="w-16 h-9 text-center appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-slate-300 dark:border-slate-600"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-transparent border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900 dark:text-white">
                      {(() => {
                        let totalPrice;
                        if (typeof item.price === 'number') {
                          totalPrice = (item.price * item.quantity).toFixed(2);
                        } else if (typeof item.price === 'string') {
                          const cleanPrice = String(item.price).replace(/[^\d.-]/g, '');
                          totalPrice = ((parseFloat(cleanPrice) || 0) * item.quantity).toFixed(2);
                        } else if (item.selectedSizes && item.selectedSizes.length > 0) {
                          // Sum of all selected sizes
                          totalPrice = item.selectedSizes.reduce((sum, size) => sum + (size.price * size.quantity), 0).toFixed(2);
                        } else {
                          totalPrice = "0.00";
                        }
                        return `${totalPrice} SEK`;
                      })()}
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-end gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="w-full sm:w-1/2 md:w-1/3 space-y-3 text-base">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Subtotal:</span>
                  <span>{subtotal.toFixed(2)} SEK</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon discount{activeCoupon?.code ? ` (${activeCoupon.code})` : ''}:</span>
                <span>-{discountAmount.toFixed(2)} SEK</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>{t.vat}:</span>
              <span>{vatAmount.toFixed(2)} SEK</span>
            </div>
            <Separator className="bg-slate-300 dark:bg-slate-600" />
            <div className="flex justify-between font-bold text-xl text-slate-900 dark:text-white">
              <span>{t.total}:</span>
              <span>{cartTotal.toFixed(2)} SEK</span>
            </div>
          </div>
          <Button 
            size="lg" 
            className="w-full sm:w-auto bg-purple-900 hover:bg-purple-800 hover:text-white text-white shadow-lg"
            onClick={() => router.push('/checkout')}
          >
            <span className="flex items-center">
              {t.checkout} <Truck className="ml-2 h-5 w-5" />
            </span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
