import { type NextRequest, NextResponse } from "next/server"
import { ProductService } from "@/lib/services/productService"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await ProductService.getProductById(params.id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productData = await request.json()
    // Accept hasVariations and variations in the body
    const updatedProduct = await ProductService.updateProduct(params.id, productData)
    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = await ProductService.deleteProduct(params.id)

    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
