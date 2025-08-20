import { NextRequest, NextResponse } from "next/server"
import { ProductService } from "@/lib/services/productService"

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [API] GET /api/products called')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    
    console.log('🔍 [API] Query parameters:', { page, limit, search, categoryId })
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      console.error('❌ [API] Invalid pagination parameters:', { page, limit })
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 500 }
      )
    }
    
    console.log('🔧 [API] Calling ProductService.getProductsPaginated...')
    const result = await ProductService.getProductsPaginated({
      page,
      limit,
      search,
      categoryId
    })
    
    console.log('✅ [API] ProductService returned:', {
      hasData: !!result.data,
      dataLength: result.data?.length,
      hasPagination: !!result.pagination,
      resultKeys: Object.keys(result)
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ [API] Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Accept hasVariations and variations in the body
    const product = await ProductService.createProduct(body)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}
