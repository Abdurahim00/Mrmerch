const { MongoClient } = require('mongodb')

async function initIndexes() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/printwrap_pro'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db()
    const productsCollection = db.collection('products')

    console.log('🔧 Creating database indexes...')

    // Text search index for product names and descriptions
    try {
      await productsCollection.createIndex(
        { 
          name: "text", 
          description: "text" 
        },
        { 
          name: "product_search_index",
          weights: {
            name: 10,
            description: 5
          }
        }
      )
      console.log('✅ Text search index created')
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ Text search index already exists')
      } else {
        console.error('❌ Error creating text search index:', error.message)
      }
    }

    // Category filtering index
    try {
      await productsCollection.createIndex(
        { categoryId: 1 },
        { name: "category_index" }
      )
      console.log('✅ Category index created')
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ Category index already exists')
      } else {
        console.error('❌ Error creating category index:', error.message)
      }
    }

    // Creation date index for sorting
    try {
      await productsCollection.createIndex(
        { createdAt: -1 },
        { name: "created_at_index" }
      )
      console.log('✅ Creation date index created')
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ Creation date index already exists')
      } else {
        console.error('❌ Error creating creation date index:', error.message)
      }
    }

    // Compound index for category + creation date
    try {
      await productsCollection.createIndex(
        { categoryId: 1, createdAt: -1 },
        { name: "category_created_at_index" }
      )
      console.log('✅ Compound index created')
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ Compound index already exists')
      } else {
        console.error('❌ Error creating compound index:', error.message)
      }
    }

    // Get index information
    const indexes = await productsCollection.indexes()
    console.log('\n📊 Current indexes:')
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`)
    })

    console.log('\n🎉 Database indexing completed successfully!')
    console.log('💡 Your products page should now load much faster with pagination.')

  } catch (error) {
    console.error('❌ Error initializing indexes:', error)
  } finally {
    await client.close()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run if called directly
if (require.main === module) {
  initIndexes().catch(console.error)
}

module.exports = { initIndexes }

