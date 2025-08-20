// Database initialization script
// Run this with: node scripts/init-db.js

const { MongoClient } = require("mongodb")

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://meerdanish029:q5BqGN5Wx10gihvb@printwrap.8wftxga.mongodb.net/"

async function initializeDatabase() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log("Connected to MongoDB Atlas")

    const db = client.db("printwrap-pro")

    // Create collections
    const collections = ["users", "products", "orders", "designs"]

    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName)
        console.log(`Created collection: ${collectionName}`)
      } catch (error) {
        if (error.code === 48) {
          console.log(`Collection ${collectionName} already exists`)
        } else {
          throw error
        }
      }
    }

    // Create indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("users").createIndex({ customerNumber: 1 }, { unique: true })
    await db.collection("orders").createIndex({ orderId: 1 }, { unique: true })
    await db.collection("orders").createIndex({ customer: 1 })
    await db.collection("designs").createIndex({ userId: 1 })
    await db.collection("products").createIndex({ categoryId: 1 })

    console.log("Created database indexes")

    // Insert sample data
    const sampleUsers = [
      {
        email: "user@example.com",
        password: "password",
        role: "user",
        customerNumber: "CUST-84371",
        fullName: "John Doe",
        phone: "+46 70 123 45 67",
        address: "Storgatan 1",
        city: "Stockholm",
        postalCode: "111 22",
        country: "Sweden",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "admin@example.com",
        password: "password",
        role: "admin",
        customerNumber: "ADMIN-00001",
        fullName: "Admin User",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "ops@example.com",
        password: "password",
        role: "operations",
        customerNumber: "OPS-00001",
        fullName: "Operations Manager",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const sampleProducts = [
      {
        name: "Premium Business Cards",
        price: 499,
        image: "/placeholder.svg?height=300&width=400",
        categoryId: "business-cards",
        description: "High-quality premium business cards",
        inStock: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "A5 Flyers - Glossy",
        price: 799,
        image: "/placeholder.svg?height=300&width=400",
        categoryId: "flyers",
        description: "Professional glossy A5 flyers",
        inStock: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Vinyl Sticker Sheet",
        price: 249,
        image: "/placeholder.svg?height=300&width=400",
        categoryId: "stickers",
        description: "Durable vinyl sticker sheets",
        inStock: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Full Car Wrap - Sedan",
        price: 25000,
        image: "/placeholder.svg?height=300&width=400",
        categoryId: "car-wraps",
        description: "Complete car wrap for sedan vehicles",
        inStock: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Custom T-Shirt Print",
        price: 350,
        image: "/placeholder.svg?height=300&width=400",
        categoryId: "apparel",
        description: "Custom printed t-shirts",
        inStock: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Promotional Mugs",
        price: 180,
        image: "/placeholder.svg?height=300&width=400",
        categoryId: "promotional-items",
        description: "Custom promotional mugs",
        inStock: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Insert sample data (only if collections are empty)
    const userCount = await db.collection("users").countDocuments()
    if (userCount === 0) {
      await db.collection("users").insertMany(sampleUsers)
      console.log("Inserted sample users")
    }

    const productCount = await db.collection("products").countDocuments()
    if (productCount === 0) {
      await db.collection("products").insertMany(sampleProducts)
      console.log("Inserted sample products")
    }

    console.log("Database initialization completed successfully!")
  } catch (error) {
    console.error("Error initializing database:", error)
  } finally {
    await client.close()
  }
}

initializeDatabase()
