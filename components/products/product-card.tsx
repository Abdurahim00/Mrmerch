"use client"

import type { Product } from "@/types"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { translations, productCategories } from "@/lib/constants"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Palette  } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useMemo } from "react"
import { composeProductAndDesign } from "@/lib/utils/imageCompose"
import { formatSEK } from "@/lib/utils"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { language } = useAppSelector((state) => state.app)
  const t = translations[language]
  const appliedCategoryDesigns = useAppSelector((s: any) => s.app.appliedCategoryDesigns || {})
  const designs = useAppSelector((s: any) => s.designs.items)
  const activeCoupon = useAppSelector((s: any) => s.coupons.activeCoupon)
  const allCategories = useAppSelector((s: any) => s.categories.categories)

  const handleDesignThisProduct = () => {
    router.push(`/design-tool?productId=${product.id}`)
  }

  const categoryName = useMemo(() => {
    const fromStore = (allCategories || []).find((c: any) => c.id === product.categoryId)
    if (fromStore?.name) return fromStore.name
    const fromConstants = productCategories.find((c) => c.id === product.categoryId)?.name(t)
    return fromConstants || product.categoryId
  }, [allCategories, product.categoryId, t])

  // Resolve category-level applied design (set by "Preview on other products" from designs tab)
  const appliedDesignForCategory = useMemo(() => {
    const mappedId = appliedCategoryDesigns[product.categoryId]
    if (!mappedId) return null
    return designs.find((d: any) => d.id === mappedId) || null
  }, [appliedCategoryDesigns, product.categoryId, designs])

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="relative w-full aspect-[4/3]">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover rounded-t-lg"
        />
        {appliedDesignForCategory && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent z-10" />
            {(() => {
              const overlaySrc = appliedDesignForCategory?.designData?.canvasData || appliedDesignForCategory?.preview
              const overlayScale = appliedDesignForCategory?.designData?.overlay?.scale ?? 0.6
              return (
                <img
                  src={overlaySrc || "/placeholder.svg"}
                  alt="Applied design overlay"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 object-contain"
                  style={{
                    width: `${overlayScale * 100}%`,
                    height: "auto",
                    filter: "saturate(1.05)",
                    mixBlendMode: "normal",
                  }}
                />
              )
            })()}
          </>
        )}
        {/* Favorites removed */}
      </div>
      <CardContent className="p-4 flex-grow flex flex-col">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{product.name}</h3>
        {activeCoupon && activeCoupon.discountType === "percentage" && product.eligibleForCoupons ? (
          <div className="mt-1">
            <span className="text-purple-700 dark:text-purple-300 font-bold mr-2">
              {formatSEK(product.price * (1 - activeCoupon.discountValue / 100))}
            </span>
            <span className="text-slate-400 line-through">{formatSEK(product.price)}</span>
          </div>
        ) : (
          <p className="text-purple-600 dark:text-purple-400 font-medium mt-1">{formatSEK(product.price)}</p>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{categoryName}</p>
       
      </CardContent>
      <CardFooter className="p-4 border-t dark:border-slate-700">
        <Button
          className="w-full bg-purple-900 hover:bg-purple-800 text-white shadow-md"
          onClick={handleDesignThisProduct}
          disabled={!product.inStock}
        >
          <Palette  className="mr-2 h-4 w-4" />
          Design this product
        </Button>
      </CardFooter>
    </Card>
  )
}
