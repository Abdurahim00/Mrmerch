import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit3, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import type { Product } from "@/types"
import { formatSEK } from "@/lib/utils"

interface ProductTableProps {
  products: Product[]
  loading: boolean
  t: any
  productCategories: any[]
  onEdit: (product: Product) => void
  onDelete: (id: string, name: string) => void
}

export const ProductTable: React.FC<ProductTableProps> = ({ products, loading, t, productCategories, onEdit, onDelete }) => {
  // Debug logging for category resolution
  console.log('🏷️ [ProductTable] Component rendered with:', {
    productsCount: products.length,
    productCategoriesCount: productCategories.length,
    productCategories: productCategories.map(c => ({ id: c.id, name: c.name })),
    sampleProduct: products[0] ? {
      id: products[0].id,
      name: products[0].name,
      categoryId: products[0].categoryId
    } : null
  })

  const ProductSkeleton = () => (
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="w-12 h-12"><Skeleton className="w-full h-full rounded-lg" /></div>
          <div className="w-1/4"><Skeleton className="h-8 w-full" /></div>
          <div className="w-1/6"><Skeleton className="h-6 w-3/4" /></div>
          <div className="w-1/6"><Skeleton className="h-8 w-full" /></div>
          <div className="w-1/4"><Skeleton className="h-6 w-full" /></div>
          <div className="w-1/6 flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  )

  if (loading) return <ProductSkeleton />
  if (!products.length) return <div className="text-center py-12">{t.noProductsYet || "No products found"}</div>
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">{t.productImage}</TableHead>
            <TableHead className="min-w-[200px]">{t.productName}</TableHead>
            <TableHead className="min-w-[120px]">{t.category}</TableHead>
            <TableHead className="min-w-[100px]">{t.price}</TableHead>
            <TableHead className="min-w-[120px]">{t.variations || "Variations"}</TableHead>
            <TableHead className="min-w-[150px]">{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.id} className={index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"}>
              <TableCell>
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                </div>
              </TableCell>
              <TableCell className="font-medium text-slate-900 dark:text-slate-100">{product.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800">
                  {(() => {
                    const category = productCategories.find((c) => c.id === product.categoryId)
                    if (category) {
                      console.log('🏷️ [ProductTable] Found category:', { categoryId: product.categoryId, categoryName: category.name })
                      return category.name
                    } else {
                      console.log('⚠️ [ProductTable] Category not found:', { categoryId: product.categoryId, availableCategories: productCategories.map(c => ({ id: c.id, name: c.name })) })
                      return product.categoryId
                    }
                  })()}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{formatSEK(product.price)}</TableCell>
              <TableCell>
                {product.hasVariations && product.variations && product.variations.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mb-1">{t.hasVariations || "Has Variations"}</Badge>
                    <div className="flex flex-wrap gap-1">
                      {product.variations.map((v) => (
                        <span key={v.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700">
                          <span style={{ background: v.color.hex_code, width: 12, height: 12, borderRadius: "50%", display: "inline-block" }} />
                          {v.color.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">{t.noVariations || "No Variations"}</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete(product.id, product.name)} className="text-red-600 border-red-200">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}