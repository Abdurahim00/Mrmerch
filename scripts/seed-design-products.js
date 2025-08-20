const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || 'mongodb+srv://meerdanish029:q5BqGN5Wx10gihvb@printwrap.8wftxga.mongodb.net/'

// Design products that will be stored in the designs collection
const designProducts = [
  {
    name: "Classic T-Shirt Design",
    type: "tshirt",
    preview: "/placeholder.svg?height=300&width=300&text=T-Shirt+Design",
    userId: "system", // System-generated designs
    designData: {
      productType: "tshirt",
      baseColor: "#1f2937",
      variations: ["front", "back", "left", "right"],
      colors: [
        "#1f2937",
        "#374151",
        "#d1d5db",
        "#f3f4f6",
        "#ffffff",
        "#fef3c7",
        "#065f46",
        "#1e40af",
        "#dc2626",
        "#ea580c",
      ],
      price: "$19.99",
      image: "/placeholder.svg?height=300&width=300&text=T-Shirt",
      description: "Premium cotton t-shirt perfect for custom designs",
      inStock: true,
    },
    status: "Completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Premium Hoodie Design",
    type: "hoodie",
    preview: "/placeholder.svg?height=300&width=300&text=Hoodie+Design",
    userId: "system",
    designData: {
      productType: "hoodie",
      baseColor: "#374151",
      variations: ["front", "back", "left", "right"],
      colors: ["#374151", "#1f2937", "#d1d5db", "#ffffff", "#dc2626", "#1e40af", "#065f46"],
      price: "$39.99",
      image: "/placeholder.svg?height=300&width=300&text=Hoodie",
      description: "Comfortable hoodie with custom design options",
      inStock: true,
    },
    status: "Completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Ceramic Coffee Mug Design",
    type: "mug",
    preview: "/placeholder.svg?height=300&width=300&text=Mug+Design",
    userId: "system",
    designData: {
      productType: "mug",
      baseColor: "#ffffff",
      variations: ["front", "back"],
      colors: ["#ffffff", "#1f2937", "#dc2626", "#1e40af", "#065f46", "#ea580c"],
      price: "$12.99",
      image: "/placeholder.svg?height=300&width=300&text=Mug",
      description: "High-quality ceramic mug for your custom designs",
      inStock: true,
    },
    status: "Completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Baseball Cap Design",
    type: "cap",
    preview: "/placeholder.svg?height=300&width=300&text=Cap+Design",
    userId: "system",
    designData: {
      productType: "cap",
      baseColor: "#1f2937",
      variations: ["front", "back", "left", "right"],
      colors: ["#1f2937", "#374151", "#dc2626", "#1e40af", "#065f46", "#ffffff"],
      price: "$24.99",
      image: "/placeholder.svg?height=300&width=300&text=Cap",
      description: "Adjustable baseball cap with custom embroidery",
      inStock: true,
    },
    status: "Completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Canvas Tote Bag Design",
    type: "bag",
    preview: "/placeholder.svg?height=300&width=300&text=Tote+Bag+Design",
    userId: "system",
    designData: {
      productType: "bag",
      baseColor: "#f3f4f6",
      variations: ["front", "back"],
      colors: ["#f3f4f6", "#ffffff", "#1f2937", "#374151", "#dc2626", "#1e40af"],
      price: "$16.99",
      image: "/placeholder.svg?height=300&width=300&text=Tote+Bag",
      description: "Eco-friendly canvas tote bag for your designs",
      inStock: true,
    },
    status: "Completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Phone Case Design",
    type: "phone",
    preview: "/placeholder.svg?height=300&width=300&text=Phone+Case+Design",
    userId: "system",
    designData: {
      productType: "phone",
      baseColor: "#ffffff",
      variations: ["back"],
      colors: ["#ffffff", "#1f2937", "#374151", "#dc2626", "#1e40af", "#065f46"],
      price: "$22.99",
      image: "/placeholder.svg?height=300&width=300&text=Phone+Case",
      description: "Protective phone case with custom design",
      inStock: true,
    },
    status: "Completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

async function seedDesignProducts() {
  const client = new MongoClient(uri)

  try {
    console.log('Attempting to connect to MongoDB Atlas...')
    console.log('Connection URI:', uri)
    
    await client.connect()
    console.log('✅ Connected to MongoDB Atlas successfully!')

    const db = client.db("printwrap-pro")
    const collection = db.collection('designs')

    // Clear existing system-generated design products
    await collection.deleteMany({ userId: "system" })
    console.log('🗑️  Cleared existing system design products')

    // Insert new design products
    const result = await collection.insertMany(designProducts)
    console.log(`✅ Inserted ${result.insertedCount} design products into designs collection`)

    console.log('🎉 Design products seeded successfully in designs collection!')
    console.log('📝 Note: These are now stored in the designs collection with userId: "system"')
  } catch (error) {
    console.error('❌ Error seeding design products:', error.message)
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 MongoDB Connection Issue Detected!')
      console.log('\nTo fix this, you have several options:')
      console.log('\n1. Use MongoDB Atlas (Recommended):')
      console.log('   - Sign up at https://www.mongodb.com/atlas')
      console.log('   - Create a free cluster')
      console.log('   - Get your connection string')
      console.log('   - Set MONGODB_URI environment variable')
      console.log('\n2. Install MongoDB locally:')
      console.log('   - Download from https://www.mongodb.com/try/download/community')
      console.log('   - Install and start the MongoDB service')
      console.log('\n3. Use Docker:')
      console.log('   - Run: docker run -d -p 27017:27017 --name mongodb mongo:latest')
      console.log('\nCurrent connection string:', uri)
    }
  } finally {
    await client.close()
  }
}

seedDesignProducts() 