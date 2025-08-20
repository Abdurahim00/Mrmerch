import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit3, Trash2, Percent, DollarSign } from "lucide-react"
import type { Coupon } from "@/types"

interface CouponTableProps {
  coupons: Coupon[]
  loading: boolean
  t: any
  onEdit: (coupon: Coupon) => void
  onDelete: (id: string, code: string) => void
}

export const CouponTable: React.FC<CouponTableProps> = ({ coupons, loading, t, onEdit, onDelete }) => {
  const CouponSkeleton = () => (
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="w-1/6"><Skeleton className="h-8 w-full" /></div>
          <div className="w-2/6"><Skeleton className="h-8 w-full" /></div>
          <div className="w-1/6"><Skeleton className="h-8 w-3/4" /></div>
          <div className="w-1/6"><Skeleton className="h-6 w-16" /></div>
          <div className="w-1/6"><Skeleton className="h-6 w-20" /></div>
          <div className="w-1/6 flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  )

  if (loading) return <CouponSkeleton />
  
  if (!coupons.length) return (
    <div className="text-center py-12">
      <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
        No coupons found
      </div>
      <p className="text-slate-500 dark:text-slate-400">
        Create your first coupon to get started with discount codes.
      </p>
    </div>
  )
  
  const getStatusColor = (isActive: boolean, validUntil: Date) => {
    const now = new Date()
    if (!isActive) {
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
    if (now > validUntil) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  }

  const getStatusText = (isActive: boolean, validUntil: Date) => {
    const now = new Date()
    if (!isActive) return "Inactive"
    if (now > validUntil) return "Expired"
    return "Active"
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="overflow-x-auto max-w-full">
      <Table>
        <TableHeader>
          <TableRow className="border-primary/10 dark:border-primary/20 bg-primary/5 dark:bg-primary/10">
            <TableHead className="min-w-[120px] font-bold text-primary py-4 text-sm uppercase tracking-wider">
              Code
            </TableHead>
            <TableHead className="min-w-[200px] font-bold text-primary py-4 text-sm uppercase tracking-wider">
              Description
            </TableHead>
            <TableHead className="min-w-[120px] font-bold text-primary py-4 text-sm uppercase tracking-wider">
              Discount
            </TableHead>
            <TableHead className="min-w-[120px] font-bold text-primary py-4 text-sm uppercase tracking-wider">
              Usage
            </TableHead>
            <TableHead className="min-w-[140px] font-bold text-primary py-4 text-sm uppercase tracking-wider">
              Valid Until
            </TableHead>
            <TableHead className="min-w-[100px] font-bold text-primary py-4 text-sm uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="min-w-[140px] font-bold text-primary py-4 text-sm uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon, index) => (
            <TableRow 
              key={coupon.id} 
              className={`border-b transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 ${
                index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"
              }`}
            >
              <TableCell className="font-mono font-medium text-slate-900 dark:text-slate-100 py-4">
                {coupon.code}
              </TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300 py-4">
                <div className="max-w-[200px] truncate">
                  {coupon.description || "No description"}
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-1 text-slate-900 dark:text-slate-100 font-medium">
                  {coupon.discountType === "percentage" ? (
                    <>
                      <Percent className="h-4 w-4 text-green-600" />
                      {coupon.discountValue}%
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      {coupon.discountValue} SEK
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300 py-4">
                {coupon.currentUsageCount}
                {coupon.maxUsageCount ? ` / ${coupon.maxUsageCount}` : " / ∞"}
              </TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300 py-4">
                {formatDate(coupon.validUntil)}
              </TableCell>
              <TableCell className="py-4">
                <Badge className={`${getStatusColor(coupon.isActive, coupon.validUntil)} font-medium px-3 py-1 rounded-full text-xs`}>
                  {getStatusText(coupon.isActive, coupon.validUntil)}
                </Badge>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(coupon)} 
                    className="border-primary/30 hover:bg-primary/5 hover:border-primary dark:hover:bg-primary/20 transition-colors text-primary"
                  >
                    <Edit3 className="mr-1.5 h-4 w-4" />Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDelete(coupon.id, coupon.code)} 
                    className="bg-transparent hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-900/20 text-red-600 border-red-200 transition-colors"
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />Delete
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
