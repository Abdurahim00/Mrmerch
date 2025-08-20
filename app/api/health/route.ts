import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    console.log('🏥 [Health] Health check requested')
    
    const db = await getDatabase()
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    console.log('🏥 [Health] Database collections:', collectionNames)
    
    // Check if products collection exists
    const productsCollection = db.collection("products")
    const productCount = await productsCollection.countDocuments({})
    
    console.log('🏥 [Health] Products collection count:', productCount)
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      collections: collectionNames,
      productsCount: productCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ [Health] Health check failed:', error)
    return NextResponse.json(
      { 
        status: "unhealthy", 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
