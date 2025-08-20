import type { ObjectId } from "mongodb"

export interface CouponDocument {
  _id?: ObjectId
  code: string
  description?: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minimumOrderAmount?: number
  maxUsageCount?: number
  currentUsageCount: number
  isActive: boolean
  validFrom: Date
  validUntil: Date
  applicableProducts?: string[] // Product IDs that this coupon applies to
  applicableCategories?: string[] // Category IDs that this coupon applies to
  createdAt: Date
  updatedAt: Date
}

export interface Coupon {
  id: string
  code: string
  description?: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minimumOrderAmount?: number
  maxUsageCount?: number
  currentUsageCount: number
  isActive: boolean
  validFrom: Date
  validUntil: Date
  applicableProducts?: string[]
  applicableCategories?: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateCouponData {
  code: string
  description?: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minimumOrderAmount?: number
  maxUsageCount?: number
  isActive: boolean
  validFrom: Date
  validUntil: Date
  applicableProducts?: string[]
  applicableCategories?: string[]
}

export interface UpdateCouponData {
  id: string
  code?: string
  description?: string
  discountType?: "percentage" | "fixed"
  discountValue?: number
  minimumOrderAmount?: number
  maxUsageCount?: number
  isActive?: boolean
  validFrom?: Date
  validUntil?: Date
  applicableProducts?: string[]
  applicableCategories?: string[]
}

export interface CouponValidationResult {
  isValid: boolean
  message?: string
  discountAmount?: number
  coupon?: Coupon
}
