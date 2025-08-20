import { NextRequest, NextResponse } from "next/server"
import { getCouponById, updateCoupon, deleteCoupon } from "@/lib/services/couponService"
import type { UpdateCouponData } from "@/types"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const coupon = await getCouponById(params.id)
    
    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updateData: Partial<UpdateCouponData> = await request.json()
    
    // Validate discount value if provided
    if (updateData.discountType === "percentage" && updateData.discountValue !== undefined) {
      if (updateData.discountValue < 0 || updateData.discountValue > 100) {
        return NextResponse.json(
          { error: "Percentage discount must be between 0 and 100" },
          { status: 400 }
        )
      }
    }

    if (updateData.discountType === "fixed" && updateData.discountValue !== undefined) {
      if (updateData.discountValue < 0) {
        return NextResponse.json(
          { error: "Fixed discount amount must be positive" },
          { status: 400 }
        )
      }
    }

    // Validate dates if provided
    if (updateData.validFrom && updateData.validUntil) {
      const validFrom = new Date(updateData.validFrom)
      const validUntil = new Date(updateData.validUntil)
      
      if (validFrom >= validUntil) {
        return NextResponse.json(
          { error: "Valid from date must be before valid until date" },
          { status: 400 }
        )
      }

      updateData.validFrom = validFrom
      updateData.validUntil = validUntil
    } else if (updateData.validFrom) {
      updateData.validFrom = new Date(updateData.validFrom)
    } else if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil)
    }

    // Convert code to uppercase if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase()
    }

    const processedUpdateData: UpdateCouponData = {
      id: params.id,
      ...updateData,
    }

    const coupon = await updateCoupon(processedUpdateData)
    return NextResponse.json(coupon)
  } catch (error: any) {
    console.error("Error updating coupon:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update coupon" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteCoupon(params.id)
    
    if (!success) {
      return NextResponse.json(
        { error: "Coupon not found or failed to delete" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Coupon deleted successfully" })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    )
  }
}
