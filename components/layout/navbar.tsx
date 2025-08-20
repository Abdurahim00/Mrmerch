"use client"

import { useState, useEffect, useMemo } from "react"
import Logo from "@/public/logo.png"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { setLanguage } from "@/lib/redux/slices/appSlice"
import { setSessionUser } from "@/lib/redux/slices/authSlice" // New import
import { translations } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Palette,
  Languages,
  LayoutDashboard,
  ShoppingCart,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  Package,
  Brush,
  Car,
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react" // New NextAuth imports
import { setCart } from "@/lib/redux/slices/cartSlice"
import type { CartItem } from "@/types"
import { mergeCartsPreferRight } from "@/lib/utils/cartMerge"
import Image from "next/image"
import { useAppSelector as useSelector } from "@/lib/redux/hooks"
import { validateCouponCode, setActiveCoupon, fetchCoupons } from "@/lib/redux/slices/couponsSlice"

export function Navbar() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [couponModalOpen, setCouponModalOpen] = useState(false)
  const { data: session, status } = useSession() // Get session data
  const { language } = useAppSelector((state) => state.app)
  const { items: cartItems } = useAppSelector((state) => state.cart)
  const activeCoupon = useSelector((s) => (s as any).coupons.activeCoupon)
  const availableCoupons = useSelector((s) => (s as any).coupons.items)

  // Load coupons once for the promo bar
  useEffect(() => {
    if (!availableCoupons || availableCoupons.length === 0) {
      // @ts-ignore
      dispatch(fetchCoupons())
    }
    // hydrate active coupon from storage if present (slice already loads, this ensures banner reflects it immediately)
    try {
      const raw = localStorage.getItem("active_coupon")
      if (raw && !activeCoupon) {
        const parsed = JSON.parse(raw)
        // @ts-ignore
        dispatch(setActiveCoupon(parsed))
      }
    } catch {}
  }, [])

  // Pick a valid, active coupon created by admin
  const promoCoupon = useMemo(() => {
    const now = new Date()
    return (availableCoupons || []).find((c: any) => {
      const from = new Date(c.validFrom)
      const until = new Date(c.validUntil)
      return c.isActive && from <= now && now <= until
    }) || null
  }, [availableCoupons])

  const t = translations[language]

  // Update Redux user state when NextAuth session changes
  useEffect(() => {
    if (status === "authenticated") {
      dispatch(setSessionUser(session.user as any))

      // One-time merge on login per session
      try {
        const hasMergedKey = `guest_cart_merged_for_session_${(session.user as any).id}`
        const alreadyMerged = sessionStorage.getItem(hasMergedKey)
        // Fetch persisted user cart from DB
        const userId = (session.user as any).id
        const fetchUserCart = async () => {
          const res = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, { cache: "no-store" })
          const data = await res.json()
          return (data?.items ?? []) as CartItem[]
        }

        const persistUserCart = async (items: CartItem[]) => {
          await fetch(`/api/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, items }),
          })
        }

        ;(async () => {
          const dbCart = await fetchUserCart()
          const guestCartRaw = localStorage.getItem("cart")
          const guestCart: CartItem[] = guestCartRaw ? JSON.parse(guestCartRaw) : []

          if (!alreadyMerged) {
            // Merge guest into DB cart with guest winning on recency
            const merged = mergeCartsPreferRight(dbCart, guestCart)
            dispatch(setCart(merged))
            await persistUserCart(merged)
            // Mark merged to prevent repeat merges during this session
            sessionStorage.setItem(hasMergedKey, "1")
          } else {
            // Hydrate from DB only
            dispatch(setCart(dbCart))
            // Ensure localStorage cart mirrors user cart while logged in
            localStorage.setItem("cart", JSON.stringify(dbCart))
          }
        })()
      } catch (e) {
        console.error("Cart merge/hydrate failed", e)
      }
    } else if (status === "unauthenticated") {
      // Enter guest mode: only clear session user; keep guest cart in localStorage
      dispatch(setSessionUser(null))
      // Additionally, clear the per-session merge flag so a future login can merge again
      try {
        // We cannot know userId when unauthenticated; clear all merge flags for safety
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith("guest_cart_merged_for_session_")) sessionStorage.removeItem(k)
        })
      } catch {}
    }
  }, [session, status, dispatch])

  const handleLogout = async () => {
    await signOut({ redirect: false }) // Sign out with NextAuth
    dispatch(setSessionUser(null)) // Clear Redux state
    // Clear local guest cart to ensure no logged-in data remains visible
    try {
      localStorage.removeItem("cart")
    } catch {}
    dispatch(setCart([]))
    setMobileMenuOpen(false)
    router.push("/")
  }

  // Persist cart to DB when authenticated and cart changes (debounced)
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return
    const userId = (session.user as any).id
    const t = setTimeout(() => {
      fetch(`/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, items: cartItems }),
      }).catch(() => {})
      // Keep localStorage mirroring while logged in
      try { localStorage.setItem("cart", JSON.stringify(cartItems)) } catch {}
    }, 400)
    return () => clearTimeout(t)
  }, [cartItems, status, session])

  const handleLanguageChange = (lang: "en" | "sv") => {
    dispatch(setLanguage(lang))
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-200 dark:border-purple-700 bg-white/80 dark:bg-purple-900/80 backdrop-blur-md">
      {/* Promo bar (from admin-created active coupon) */}
      {promoCoupon && (
        <div className="w-full bg-purple-600 text-white text-center text-sm py-2 cursor-pointer" onClick={() => setCouponModalOpen(true)}>
          <span className="font-semibold">
            {promoCoupon.discountType === "percentage" ? `${promoCoupon.discountValue}% off` : `${promoCoupon.discountValue} off`} 
          </span>
          <span className="ml-2">Promo code: <span className="underline font-mono">{promoCoupon.code}</span></span>
        </div>
      )}
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Image src={Logo} alt="Logo" width={120} height={120} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button 
            className={`${
              pathname === '/products' || pathname?.startsWith('/products') 
                ? 'bg-primary text-white' 
                : 'hover:bg-primary hover:text-white'
            } transition-colors`} 
            variant="ghost" 
            asChild
          >
            <Link href="/products" className="flex items-center">{t.products}</Link>
          </Button>
          <Button 
            className={`${
              pathname === '/design-tool' || pathname?.startsWith('/design-tool') 
                ? 'bg-primary text-white' 
                : 'hover:bg-primary hover:text-white'
            } transition-colors`} 
            variant="ghost" 
            asChild
          >
            <Link href="/design-tool" className="flex items-center">{t.designTool}</Link>
          </Button>
          <Button 
            className={`${
              pathname === '/car-mockup' || pathname?.startsWith('/car-mockup') 
                ? 'bg-primary text-white' 
                : 'hover:bg-primary hover:text-white'
            } transition-colors`} 
            variant="ghost" 
            asChild
          >
            <Link href="/car-mockup" className="flex items-center">{t.carWrapDesigner}</Link>
          </Button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[120px] bg-primary text-white border-primary hover:bg-primary hover:text-white">
              <Languages className="h-4 w-4 mr-2 " />
              <SelectValue placeholder={t.language} />
            </SelectTrigger>
            <SelectContent className="bg-primary text-white border-primary">
              <SelectItem value="en" className="text-white data-[highlighted]:bg-purple-700 data-[highlighted]:text-white">English</SelectItem>
              <SelectItem value="sv" className="text-white data-[highlighted]:bg-purple-700 data-[highlighted]:text-white">Svenska</SelectItem>
            </SelectContent>
          </Select>

          {/* Cart Icon - Always visible */}
          <Button className="bg-primary hover:bg-primary hover:text-white text-white" asChild>
            <Link href="/cart" className="flex items-center">
              <ShoppingCart className="mr-2 h-4 w-4" />
              {t.cart}
              {cartItemCount > 0 && (
                <span className="ml-1 bg-white text-purple-900 rounded-full px-2.5 py-1 text-xs font-bold">{cartItemCount}</span>
              )}
            </Link>
          </Button>

          {status === "authenticated" ? (
            <>
              <Button 
                variant="ghost" 
                asChild 
                className={`${
                  pathname === '/dashboard' || pathname?.startsWith('/dashboard') 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-primary hover:text-white'
                } transition-colors hidden lg:inline-flex`}
              >
                <Link href="/dashboard" className="flex items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> {t.dashboard}
                </Link>
              </Button>
              <Button onClick={handleLogout} variant="ghost" className="hover:bg-primary hover:text-white">
                <LogOut className="mr-2 h-4 w-4" />
                {t.logout}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login" className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" /> {t.login}
                </Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary hover:text-white text-white">
                <Link href="/signup" className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" /> {t.signup}
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-2">
          {/* Cart Icon - Always visible on mobile */}
          <Button variant="outline" size="icon" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-4 w-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left">{t.platformName}</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-4 mt-6">
                {/* Language Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.language}</label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="bg-primary text-white border-primary hover:bg-primary hover:text-white">
                      <Languages className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-primary text-white border-primary">
                      <SelectItem value="en" className="text-white data-[highlighted]:bg-purple-700 data-[highlighted]:text-white">English</SelectItem>
                      <SelectItem value="sv" className="text-white data-[highlighted]:bg-purple-700 data-[highlighted]:text-white">Svenska</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Navigation Links */}
                <div className="space-y-2">
                  <Button variant="ghost" asChild className="w-full justify-start" onClick={closeMobileMenu}>
                    <Link href="/products">
                      <Package className="mr-2 h-4 w-4" />
                      {t.products}
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full justify-start" onClick={closeMobileMenu}>
                    <Link href="/design-tool">
                      <Brush className="mr-2 h-4 w-4" />
                      {t.designTool}
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full justify-start" onClick={closeMobileMenu}>
                    <Link href="/car-mockup">
                      <Car className="mr-2 h-4 w-4" />
                      {t.carWrapDesigner}
                    </Link>
                  </Button>
                </div>

                {status === "authenticated" && session?.user && (
                  <>
                    <Separator />
                    <Button 
                      variant="ghost" 
                      asChild 
                      className={`w-full justify-start ${
                        pathname === '/dashboard' || pathname?.startsWith('/dashboard') 
                          ? 'bg-primary text-white' 
                          : 'hover:bg-primary hover:text-white'
                      }`} 
                      onClick={closeMobileMenu}
                    >
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t.dashboard}
                      </Link>
                    </Button>
                  </>
                )}

                <Separator />

                {/* Auth Actions */}
                {status === "authenticated" && session?.user ? (
                  <div className="space-y-2">
                    <div className="text-sm text-purple-600 dark:text-purple-400 p-2">
                      <p className="font-medium">{session.user.email}</p>
                      <p className="text-xs">{(session.user as any).customerNumber}</p>
                    </div>
                    <Button onClick={handleLogout} variant="ghost" className="w-full justify-start hover:bg-primary hover:text-white">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t.logout}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      asChild
                      className="w-full justify-start bg-transparent"
                      onClick={closeMobileMenu}
                    >
                      <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        {t.login}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full justify-start bg-purple-600 hover:bg-purple-700 hover:text-white text-white"
                      onClick={closeMobileMenu}
                    >
                      <Link href="/signup">
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t.signup}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Coupon modal */}
      <Dialog open={couponModalOpen} onOpenChange={setCouponModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-center">
              {promoCoupon && promoCoupon.discountType === "percentage"
                ? `${promoCoupon.discountValue}% OFF EVERYTHING`
                : activeCoupon && activeCoupon.discountType === "percentage"
                ? `${activeCoupon.discountValue}% OFF EVERYTHING`
                : "COUPON"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="text-lg font-semibold">Promo code: <span className="font-mono">{promoCoupon?.code ?? activeCoupon?.code ?? "No active coupon"}</span></div>
            <Button className="bg-purple-700 hover:bg-purple-800" onClick={async () => {
              const code = promoCoupon?.code ?? activeCoupon?.code
              if (!code) { setCouponModalOpen(false); return }
              const orderTotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
              try {
                const result = await dispatch(validateCouponCode({ code, orderTotal, cartItems }) as any)
                const payload = result?.payload
                if (payload?.isValid && payload?.coupon) {
                  dispatch(setActiveCoupon(payload.coupon))
                  setCouponModalOpen(false)
                  // Toast celebration
                  try {
                    const { toast } = await import("@/hooks/use-toast")
                    toast({
                      title: "🎉 Coupon Applied",
                      description: `${payload.coupon.code} activated. Prices for eligible products are discounted ${payload.coupon.discountValue}%`,
                    })
                  } catch {}
                }
              } catch {}
            }}>Redeem coupon</Button>
            <p className="text-xs text-slate-500">Discount applies to products marked as eligible. Shown prices will reflect the discount.</p>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
