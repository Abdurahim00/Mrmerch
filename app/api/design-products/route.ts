import { NextRequest, NextResponse } from "next/server"
import { DesignProductService } from "@/lib/services/designProductService"

export async function GET() {
  try {
    const products = await DesignProductService.getAllDesignProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching design products:", error)
    return NextResponse.json(
      { error: "Failed to fetch design products" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const product = await DesignProductService.createDesignProduct(body)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating design product:", error)
    return NextResponse.json(
      { error: "Failed to create design product" },
      { status: 500 }
    )
  }
} 