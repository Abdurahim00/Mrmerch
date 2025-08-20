"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { createOrder } from "@/lib/redux/slices/ordersSlice"
import { clearCart } from "@/lib/redux/slices/cartSlice"
import { translations } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ShieldCheck, CreditCard, Smartphone, ClubIcon as KlarnaIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import StripePaymentModal from "@/components/payment/stripe-payment-modal"

export default function CheckoutPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { items: cart } = useAppSelector((state) => state.cart)
  const { data: session } = useSession()
  const { language } = useAppSelector((state) => state.app)
  const t = translations[language]
  const { toast } = useToast()

  const [paymentMethod, setPaymentMethod] = useState("card")
  const [shippingOption, setShippingOption] = useState("standard")
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)

  // Billing/Shipping form state
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [country, setCountry] = useState("")

  // Coupon state
  const [couponCode, setCouponCode] = useState("")
  const globalActiveCoupon = useAppSelector((s: any) => s.coupons.activeCoupon)
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState("")

  const subtotal = cart.reduce((total, item) => {
    let itemPrice = 0;
    
    // Handle different price formats
    if (typeof item.price === 'number') {
      itemPrice = item.price;
    } else if (typeof item.price === 'string') {
      // Remove any non-numeric characters except decimal point
      const cleanPrice = item.price.replace(/[^\d.-]/g, '');
      itemPrice = parseFloat(cleanPrice) || 0;
    }
    
    // If we have selectedSizes, calculate from those instead
    if (item.selectedSizes && item.selectedSizes.length > 0) {
      return total + item.selectedSizes.reduce((sum, size) => sum + (size.price * size.quantity), 0);
    }
    
    return total + (itemPrice * item.quantity);
  }, 0)
  
  // Prefer globally active coupon if present; compute discount accordingly
  const percentageDiscount = globalActiveCoupon?.discountType === "percentage" ? globalActiveCoupon.discountValue : 0
  const eligibleSubtotal = cart.reduce((total, item) => {
    const eligible = (item as any).eligibleForCoupons === true
    let pricePerUnit = 0
    if (item.selectedSizes && item.selectedSizes.length > 0) {
      pricePerUnit = item.selectedSizes.reduce((s, sz) => s + (sz.price * sz.quantity), 0) / item.quantity
    } else if (typeof item.price === 'number') {
      pricePerUnit = item.price
    } else if (typeof item.price === 'string') {
      pricePerUnit = parseFloat(item.price.replace(/[^\d.-]/g, '')) || 0
    }
    return total + (eligible ? pricePerUnit * item.quantity : 0)
  }, 0)
  const globalDiscountAmount = (eligibleSubtotal * percentageDiscount) / 100
  const discountAmount = appliedCoupon?.discountAmount || globalDiscountAmount || 0
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)
  const vatAmount = subtotalAfterDiscount * 0.25
  const shippingCost = shippingOption === "express" ? 149 : 79
  const grandTotal = subtotalAfterDiscount + vatAmount + shippingCost



// Add this effect:
useEffect(() => {
  if (session?.user) {
    const user = session.user as any;
    if (!fullName && user.fullName) setFullName(user.fullName);
    if (!email && user.email) setEmail(user.email);
    if (!phone && user.phone) setPhone(user.phone);
    if (!address && user.address) setAddress(user.address);
    if (!city && user.city) setCity(user.city);
    if (!postalCode && user.postalCode) setPostalCode(user.postalCode);
    if (!country && user.country) setCountry(user.country);
  }
}, [session, fullName, email, phone, address, city, postalCode, country]);

  const handleApplyCoupon = async () => {
    // If a global active coupon exists, prefer that and skip manual code
    if (globalActiveCoupon?.code) {
      setAppliedCoupon({ coupon: globalActiveCoupon, discountAmount: globalDiscountAmount })
      try {
        const { toast } = await import("@/hooks/use-toast")
        toast({ title: "🎉 Coupon Applied", description: `${globalActiveCoupon.code} activated.` })
      } catch {}
      setCouponCode("")
      return
    }
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    setCouponLoading(true)
    setCouponError("")

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderTotal: subtotal,
          cartItems: cart,
        }),
      })

      const result = await response.json()

      if (result.isValid) {
        setAppliedCoupon(result)
        try {
          const { toast } = await import("@/hooks/use-toast")
          toast({ title: "🎉 Coupon Applied", description: `${result.coupon.code} activated.` })
        } catch {}
        toast({
          title: "Coupon Applied!",
          description: `You saved ${result.discountAmount.toFixed(2)} SEK with coupon "${couponCode.toUpperCase()}"`,
          variant: "success",
        })
        setCouponCode("")
      } else {
        setCouponError(result.message || "Invalid coupon code")
      }
    } catch (error) {
      setCouponError("Failed to apply coupon. Please try again.")
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
    toast({
      title: "Coupon Removed",
      description: "The coupon discount has been removed from your order.",
    })
  }

  const handlePayment = async () => {
    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Your cart is empty. Please add products before checking out.",
        variant: "destructive",
      })
      router.push("/products")
      return
    }

    // Validate required fields
    if (!fullName || !email || !phone || !address || !city || !postalCode || !country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required billing and shipping information.",
        variant: "destructive",
      })
      return
    }

      const orderData = {
      customer: (session?.user as any)?.customerNumber || "Guest",
      total: grandTotal,
      items: cart.map((item) => {
        // Calculate correct price for the item
        let itemPrice;
        
        if (item.selectedSizes && item.selectedSizes.length > 0) {
          // For items with size variations, use the size-based price
          itemPrice = item.selectedSizes.reduce((total, size) => total + (size.price * size.quantity), 0) / item.quantity;
        } else if (typeof item.price === 'number') {
          itemPrice = item.price;
        } else if (typeof item.price === 'string') {
          const cleanPrice = item.price.replace(/[^\d.-]/g, '');
          itemPrice = parseFloat(cleanPrice) || 0;
        } else {
          itemPrice = 0;
        }
        
          return {
            name: item.name,
            quantity: item.quantity,
            price: itemPrice,
            designId: item.designId,
            designPreview: item.designPreview,
            selectedSizes: item.selectedSizes,
            designContext: (item as any).designContext,
            designCanvasJSON: (item as any).designCanvasJSON,
            productId: (item as any).productId || item.id,
          };
      }),
      shippingOption: shippingOption as "standard" | "express",
      paymentMethod: paymentMethod as "card" | "swish" | "klarna",
      status: "Queued" as const, // Default status for new orders
      // Customer information from form
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      customerAddress: address,
      customerCity: city,
      customerPostalCode: postalCode,
      customerCountry: country,
      // Coupon information
      appliedCoupon: appliedCoupon ? {
        code: appliedCoupon.coupon.code,
        discountAmount: appliedCoupon.discountAmount,
        discountType: appliedCoupon.coupon.discountType,
      } : null,
    }

    setOrderData(orderData)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setLoading(true)
      
      // Create order with payment information
      const orderWithPayment = {
        ...orderData,
        paymentIntentId,
        status: "Queued" as const,
      }

      await dispatch(createOrder(orderWithPayment)).unwrap()
      dispatch(clearCart())
      
      toast({
        title: "Payment Successful",
        description: "Your order has been placed successfully!",
        variant: "success",
      })

      router.push("/order-confirmation")
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Order Creation Failed",
        description: "Payment was successful but order creation failed. Please contact support.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setShowPaymentModal(false)
    }
  }

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error)
    setShowPaymentModal(false)
  }

  // if (cart.length === 0) {
  //   // Redirect to cart if empty, but only if not already on order-confirmation
  //   if (typeof window !== "undefined" && !window.location.pathname.includes("/order-confirmation")) {
  //     router.push("/cart")
  //   }
  //   return null
  // }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center text-slate-900 dark:text-white">{t.checkout}</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">
                {t.billingShippingInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="checkout-name">{t.fullName}</Label>
                  <Input
                    id="checkout-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.fullName}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="checkout-email">{t.email}</Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="checkout-phone">{t.phone}</Label>
                <Input
                  id="checkout-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+46 70 123 45 67"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="checkout-address">{t.address}</Label>
                <Input
                  id="checkout-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Storgatan 1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="checkout-city">{t.city}</Label>
                  <Input
                    id="checkout-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Stockholm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="checkout-postal">{t.postalCode}</Label>
                  <Input
                    id="checkout-postal"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="111 22"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="checkout-country">{t.country}</Label>
                  <Input
                    id="checkout-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Sweden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">
                {t.shippingOptions}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <RadioGroup value={shippingOption} onValueChange={setShippingOption} className="space-y-3">
                <Label
                  htmlFor="std-shipping"
                  className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50 dark:has-[:checked]:bg-sky-900/30 cursor-pointer transition-all duration-200"
                >
                  <RadioGroupItem value="standard" id="std-shipping" />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-white">{t.standardShipping}</span>
                    <span className="text-slate-600 dark:text-slate-400 text-sm">79 SEK</span>
                  </div>
                </Label>
                <Label
                  htmlFor="exp-shipping"
                  className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50 dark:has-[:checked]:bg-sky-900/30 cursor-pointer transition-all duration-200"
                >
                  <RadioGroupItem value="express" id="exp-shipping" />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-white">{t.expressShipping}</span>
                    <span className="text-slate-600 dark:text-slate-400 text-sm">149 SEK</span>
                  </div>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">{t.orderSummary}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6 text-base">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>
                    {(() => {
                      let totalPrice;
                      if (item.selectedSizes && item.selectedSizes.length > 0) {
                        // Calculate from selected sizes
                        totalPrice = item.selectedSizes.reduce((sum, size) => sum + (size.price * size.quantity), 0);
                      } else if (typeof item.price === 'number') {
                        totalPrice = item.price * item.quantity;
                      } else if (typeof item.price === 'string') {
                        const cleanPrice = item.price.replace(/[^\d.-]/g, '');
                        totalPrice = (parseFloat(cleanPrice) || 0) * item.quantity;
                      } else {
                        totalPrice = 0;
                      }
                      return `${totalPrice.toFixed(2)} SEK`;
                    })()}
                  </span>
                </div>
              ))}
              <Separator className="bg-slate-200 dark:bg-slate-700" />
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Subtotal:</span>
                <span>{subtotal.toFixed(2)} SEK</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount ({appliedCoupon.coupon.code}):</span>
                  <span>-{discountAmount.toFixed(2)} SEK</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>{t.vat}:</span>
                <span>{vatAmount.toFixed(2)} SEK</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>{t.shipping}:</span>
                <span>{shippingCost.toFixed(2)} SEK</span>
              </div>
              <Separator className="bg-slate-200 dark:bg-slate-700" />
              <div className="flex justify-between font-bold text-xl text-slate-900 dark:text-white">
                <span>{t.total}:</span>
                <span>{grandTotal.toFixed(2)} SEK</span>
              </div>
            </CardContent>
          </Card>

          {/* Coupon Code Section */}
          <Card className="shadow-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">Coupon Code</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {appliedCoupon ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-green-800 dark:text-green-200">
                          {appliedCoupon.coupon.code}
                        </span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Applied
                        </Badge>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        You're saving {discountAmount.toFixed(2)} SEK on this order!
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveCoupon}
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase())
                          setCouponError("")
                        }}
                        className={couponError ? "border-red-500 focus:border-red-500" : ""}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleApplyCoupon()
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-slate-600 hover:bg-slate-700 text-white"
                    >
                      {couponLoading ? "Applying..." : "Apply"}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{couponError}</p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Have a coupon code? Enter it above to apply your discount.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">{t.paymentMethod}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-700">
                  <TabsTrigger
                    value="card"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"
                  >
                    <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
                    {t.payWithCard}
                  </TabsTrigger>
                  <TabsTrigger
                    value="swish"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"
                  >
                    <Smartphone className="h-4 w-4 mr-1 sm:mr-2" />
                    {t.payWithSwish}
                  </TabsTrigger>
                  <TabsTrigger
                    value="klarna"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"
                  >
                    <KlarnaIcon className="h-4 w-4 mr-1 sm:mr-2" />
                    {t.payWithKlarna}
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="card"
                  className="mt-4 text-sm text-slate-700 dark:text-slate-300 p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800/50"
                >
                  {t.mockCardPayment}
                </TabsContent>
                <TabsContent
                  value="swish"
                  className="mt-4 text-sm text-slate-700 dark:text-slate-300 p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800/50"
                >
                  {t.mockSwishInstructions}
                </TabsContent>
                <TabsContent
                  value="klarna"
                  className="mt-4 text-sm text-slate-700 dark:text-slate-300 p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800/50"
                >
                  {t.mockKlarnaOptions}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button
                size="lg"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white shadow-lg"
                onClick={handlePayment}
                disabled={loading}
              >
                <ShieldCheck className="mr-2 h-5 w-5" />
                {loading ? t.processing : `${t.payNow} (${grandTotal.toFixed(2)} SEK)`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Stripe Payment Modal */}
      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={grandTotal}
        currency="sek"
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        orderData={orderData}
      />
    </div>
  )
}
