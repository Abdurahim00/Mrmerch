import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import type { Coupon, CreateCouponData, UpdateCouponData, CouponValidationResult } from "@/types"
import type { CouponDocument } from "@/lib/models/Coupon"

const COLLECTION_NAME = "coupons"

// Convert MongoDB document to Coupon object
function convertCouponDocumentToCoupon(doc: CouponDocument): Coupon {
  return {
    id: doc._id!.toString(),
    code: doc.code,
    description: doc.description,
    discountType: doc.discountType,
    discountValue: doc.discountValue,
    minimumOrderAmount: doc.minimumOrderAmount,
    maxUsageCount: doc.maxUsageCount,
    currentUsageCount: doc.currentUsageCount,
    isActive: doc.isActive,
    validFrom: doc.validFrom,
    validUntil: doc.validUntil,
    applicableProducts: doc.applicableProducts,
    applicableCategories: doc.applicableCategories,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function createCoupon(couponData: CreateCouponData): Promise<Coupon> {
  const db = await getDatabase()
  const collection = db.collection<CouponDocument>(COLLECTION_NAME)

  // Check if coupon code already exists
  const existingCoupon = await collection.findOne({ code: couponData.code })
  if (existingCoupon) {
    throw new Error("Coupon code already exists")
  }

  const now = new Date()
  const couponDocument: Omit<CouponDocument, "_id"> = {
    ...couponData,
    currentUsageCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  const result = await collection.insertOne(couponDocument as CouponDocument)
  const insertedCoupon = await collection.findOne({ _id: result.insertedId })

  if (!insertedCoupon) {
    throw new Error("Failed to create coupon")
  }

  return convertCouponDocumentToCoupon(insertedCoupon)
}

export async function getAllCoupons(): Promise<Coupon[]> {
  const db = await getDatabase()
  const collection = db.collection<CouponDocument>(COLLECTION_NAME)

  const coupons = await collection.find({}).sort({ createdAt: -1 }).toArray()
  return coupons.map(convertCouponDocumentToCoupon)
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  const db = await getDatabase()
  const collection = db.collection<CouponDocument>(COLLECTION_NAME)

  try {
    const coupon = await collection.findOne({ _id: new ObjectId(id) })
    return coupon ? convertCouponDocumentToCoupon(coupon) : null
  } catch (error) {
    console.error("Error getting coupon by ID:", error)
    return null
  }
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const db = await getDatabase()
  const collection = db.collection<CouponDocument>(COLLECTION_NAME)

  const coupon = await collection.findOne({ code: code.toUpperCase() })
  return coupon ? convertCouponDocumentToCoupon(coupon) : null
}

export async function updateCoupon(updateData: UpdateCouponData): Promise<Coupon> {
  const db = await getDatabase()
  const collection = db.collection<CouponDocument>(COLLECTION_NAME)

  const { id, ...updateFields } = updateData

  // If updating code, check if it already exists
  if (updateFields.code) {
    const existingCoupon = await collection.findOne({ 
      code: updateFields.code,
      _id: { $ne: new ObjectId(id) }
    })
    if (existingCoupon) {
      throw new Error("Coupon code already exists")
    }
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        ...updateFields, 
        updatedAt: new Date() 
      } 
    },
    { returnDocument: "after" }
  )

  if (!result) {
    throw new Error("Coupon not found")
  }

  return convertCouponDocumentToCoupon(result)
}

export async function deleteCoupon(id: string): Promise<boolean> {
  const db = await getDatabase()
  const collection = db.collection<CouponDocument>(COLLECTION_NAME)

  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return false
  }
}

export async function validateCoupon(
  code: string, 
  orderTotal: number,
  cartItems: any[] = []
): Promise<CouponValidationResult> {
  const coupon = await getCouponByCode(code)

  if (!coupon) {
    return {
      isValid: false,
      message: "Invalid coupon code"
    }
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    return {
      isValid: false,
      message: "This coupon is no longer active"
    }
  }

  // Check date validity
  const now = new Date()
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return {
      isValid: false,
      message: "This coupon has expired or is not yet valid"
    }
  }

  // Check minimum order amount
  if (coupon.minimumOrderAmount && orderTotal < coupon.minimumOrderAmount) {
    return {
      isValid: false,
      message: `Minimum order amount of ${coupon.minimumOrderAmount} SEK required`
    }
  }

  // Check usage limit
  if (coupon.maxUsageCount && coupon.currentUsageCount >= coupon.maxUsageCount) {
    return {
      isValid: false,
      message: "This coupon has reached its usage limit"
    }
  }

  // Check product/category restrictions
  if (coupon.applicableProducts?.length || coupon.applicableCategories?.length) {
    const hasApplicableItems = cartItems.some(item => {
      const baseProductId = item.productId || item.id
      if (coupon.applicableProducts?.includes(baseProductId)) return true
      if (coupon.applicableCategories?.includes(item.categoryId)) return true
      return false
    })

    if (!hasApplicableItems) {
      return {
        isValid: false,
        message: "This coupon is not applicable to items in your cart"
      }
    }
  }

  // Calculate discount amount
  let discountAmount = 0
  if (coupon.discountType === "percentage") {
    discountAmount = (orderTotal * coupon.discountValue) / 100
  } else if (coupon.discountType === "fixed") {
    discountAmount = Math.min(coupon.discountValue, orderTotal)
  }

  return {
    isValid: true,
    message: "Coupon applied successfully",
    discountAmount,
    coupon
  }
}

export async function incrementCouponUsage(id: string): Promise<void> {
  const db = await getDatabase()
  const collection = db.collection<CouponDocument>(COLLECTION_NAME)

  await collection.updateOne(
    { _id: new ObjectId(id) },
    { 
      $inc: { currentUsageCount: 1 },
      $set: { updatedAt: new Date() }
    }
  )
}
