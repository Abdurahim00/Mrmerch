import { NextRequest, NextResponse } from "next/server"
import { validateCoupon } from "@/lib/services/couponService"

export async function POST(request: NextRequest) {
  try {
    const { code, orderTotal, cartItems } = await request.json()
    
    if (!code || orderTotal === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: code and orderTotal are required" },
        { status: 400 }
      )
    }

    if (typeof orderTotal !== "number" || orderTotal < 0) {
      return NextResponse.json(
        { error: "Order total must be a positive number" },
        { status: 400 }
      )
    }

    const validationResult = await validateCoupon(code, orderTotal, cartItems || [])
    
    return NextResponse.json(validationResult)
  } catch (error) {
    console.error("Error validating coupon:", error)
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    )
  }
}
