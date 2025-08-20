import { MongoClient, type Db } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
console.log('🔌 [MongoDB] Connection URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))

const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  const dbName = "printwrap-pro"
  console.log('🔌 [MongoDB] Connecting to database:', dbName)
  return client.db(dbName)
}

// Initialize database indexes for performance optimization
export async function initializeIndexes() {
  try {
    const db = await getDatabase()
    const productsCollection = db.collection("products")
    
    console.log('🔧 [MongoDB] Initializing database indexes...')
    
    // Create indexes for better performance
    await Promise.all([
      // Text search index
      productsCollection.createIndex(
        { name: "text", description: "text" },
        { 
          name: "product_search_index",
          weights: { name: 10, description: 5 }
        }
      ).catch(() => console.log('ℹ️ Text search index already exists')),
      
      // Category index
      productsCollection.createIndex(
        { categoryId: 1 },
        { name: "category_index" }
      ).catch(() => console.log('ℹ️ Category index already exists')),
      
      // Creation date index
      productsCollection.createIndex(
        { createdAt: -1 },
        { name: "created_at_index" }
      ).catch(() => console.log('ℹ️ Creation date index already exists')),
      
      // Compound index
      productsCollection.createIndex(
        { categoryId: 1, createdAt: -1 },
        { name: "category_created_at_index" }
      ).catch(() => console.log('ℹ️ Compound index already exists'))
    ])
    
    console.log('✅ [MongoDB] Database indexes initialized successfully')
  } catch (error) {
    console.error('❌ [MongoDB] Error initializing indexes:', error)
  }
}

// Auto-initialize indexes in development
if (process.env.NODE_ENV === 'development') {
  initializeIndexes()
}
