import { NextRequest, NextResponse } from "next/server"
import { createCoupon, getAllCoupons } from "@/lib/services/couponService"
import type { CreateCouponData } from "@/types"

export async function GET() {
  try {
    const coupons = await getAllCoupons()
    return NextResponse.json(coupons)
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const couponData: CreateCouponData = await request.json()
    
    // Validate required fields
    if (!couponData.code || !couponData.discountType || couponData.discountValue === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: code, discountType, and discountValue are required" },
        { status: 400 }
      )
    }

    // Validate discount value
    if (couponData.discountType === "percentage" && (couponData.discountValue < 0 || couponData.discountValue > 100)) {
      return NextResponse.json(
        { error: "Percentage discount must be between 0 and 100" },
        { status: 400 }
      )
    }

    if (couponData.discountType === "fixed" && couponData.discountValue < 0) {
      return NextResponse.json(
        { error: "Fixed discount amount must be positive" },
        { status: 400 }
      )
    }

    // Validate dates
    const validFrom = new Date(couponData.validFrom)
    const validUntil = new Date(couponData.validUntil)
    
    if (validFrom >= validUntil) {
      return NextResponse.json(
        { error: "Valid from date must be before valid until date" },
        { status: 400 }
      )
    }

    // Convert string dates to Date objects
    const processedCouponData = {
      ...couponData,
      code: couponData.code.toUpperCase(),
      validFrom,
      validUntil,
    }

    const coupon = await createCoupon(processedCouponData)
    return NextResponse.json(coupon, { status: 201 })
  } catch (error: any) {
    console.error("Error creating coupon:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create coupon" },
      { status: 500 }
    )
  }
}
