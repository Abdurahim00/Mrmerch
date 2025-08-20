import { NextResponse } from "next/server"
import { DesignProductService } from "@/lib/services/designProductService"

export async function GET() {
  try {
    // Test the connection and service
    const products = await DesignProductService.getAllDesignProducts()
    return NextResponse.json({
      success: true,
      count: products.length,
      products: products.slice(0, 2) // Return first 2 products for testing
    })
  } catch (error) {
    console.error("Error testing design products API:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 