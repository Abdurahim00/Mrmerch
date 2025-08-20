import { getDatabase } from "@/lib/mongodb"
import type { ProductDocument, Product } from "@/lib/models/Product"
import { ObjectId } from "mongodb"

// Interface for pagination parameters
export interface PaginationParams {
  page: number
  limit: number
  search?: string
  categoryId?: string
}

// Interface for paginated results
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class ProductService {
  private static async getCollection() {
    const db = await getDatabase()
    const collectionName = "products"
    console.log('🔌 [ProductService] Accessing collection:', collectionName)
    return db.collection<ProductDocument>(collectionName)
  }

  // Create database indexes for performance optimization
  static async createIndexes() {
    const collection = await this.getCollection()
    
    try {
      // Compound index for search and filtering
      await collection.createIndex(
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
      
      // Index for category filtering
      await collection.createIndex(
        { categoryId: 1 },
        { name: "category_index" }
      )
      
      // Index for pagination and sorting
      await collection.createIndex(
        { createdAt: -1 },
        { name: "created_at_index" }
      )
      
      // Compound index for category + creation date (common query pattern)
      await collection.createIndex(
        { categoryId: 1, createdAt: -1 },
        { name: "category_created_at_index" }
      )
      
      console.log('✅ [ProductService] Database indexes created successfully')
    } catch (error) {
      console.error('❌ [ProductService] Error creating indexes:', error)
    }
  }

  static async createProduct(productData: Omit<ProductDocument, "_id" | "createdAt" | "updatedAt">): Promise<Product> {
    const collection = await this.getCollection()

    // Debug: Log what's being received for individual angle images
    console.log('🔧 [ProductService] Creating product with data:', {
      name: productData.name,
      hasVariations: productData.hasVariations,
      angles: productData.angles,
      individualImages: {
        frontImage: productData.frontImage,
        backImage: productData.backImage,
        leftImage: productData.leftImage,
        rightImage: productData.rightImage,
        materialImage: productData.materialImage
      },
      allKeys: Object.keys(productData)
    })

    const newProduct: ProductDocument = {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(newProduct)

    // Debug: Log what was actually stored
    console.log('🔧 [ProductService] Product created with ID:', result.insertedId.toString())

    return {
      id: result.insertedId.toString(),
      ...productData,
      hasVariations: productData.hasVariations,
      variations: productData.variations,
      eligibleForCoupons: productData.eligibleForCoupons,
      type: productData.type,
      baseColor: productData.baseColor,
      angles: productData.angles,
      colors: productData.colors,
      purchaseLimit: productData.purchaseLimit, // Add purchase limit data
      // Include individual angle images for single products
      frontImage: productData.frontImage,
      backImage: productData.backImage,
      leftImage: productData.leftImage,
      rightImage: productData.rightImage,
      materialImage: productData.materialImage,
      frontAltText: productData.frontAltText,
      backAltText: productData.backAltText,
      leftAltText: productData.leftAltText,
      rightAltText: productData.rightAltText,
      materialAltText: productData.materialAltText,
    }
  }

  static async getProductsPaginated(params: PaginationParams): Promise<PaginatedResult<Product>> {
    const collection = await this.getCollection()
    const { page, limit, search, categoryId } = params
    
    // Debug: Check if collection exists and has documents
    const totalDocuments = await collection.countDocuments({})
    console.log('🔍 [ProductService] Collection info:', {
      collectionName: collection.collectionName,
      totalDocuments,
      params
    })
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit
    
    // Build match conditions
    const matchConditions: any = {}
    
    if (categoryId && categoryId !== 'all') {
      matchConditions.categoryId = categoryId
    }
    
    if (search && search.trim() !== '') {
      // Use text search if available, otherwise use regex
      try {
        const hasTextIndex = await collection.indexExists('product_search_index')
        if (hasTextIndex) {
          matchConditions.$text = { $search: search }
        } else {
          matchConditions.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      } catch (error) {
        // Fallback to regex search if index check fails
        matchConditions.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }
    }
    
    console.log('🔍 [ProductService] Pagination query:', {
      page,
      limit,
      skip,
      search,
      categoryId,
      matchConditions
    })
    
    try {
      // Use aggregation pipeline for efficient pagination
      const pipeline = [
        { $match: matchConditions },
        { $sort: { createdAt: -1 } }, // Sort by newest first
        { $skip: skip },
        { $limit: limit },
        {
          $addFields: {
            id: { $toString: "$_id" }
          }
        },
        {
          $project: {
            _id: 0,
            id: 1,
            name: 1,
            price: 1,
            image: 1,
            categoryId: 1,
            subcategoryIds: 1,
            description: 1,
            inStock: 1,
            createdAt: 1,
            updatedAt: 1,
            hasVariations: 1,
            variations: 1,
            eligibleForCoupons: 1,
            type: 1,
            baseColor: 1,
            angles: 1,
            colors: 1,
            purchaseLimit: 1,
            frontImage: 1,
            backImage: 1,
            leftImage: 1,
            rightImage: 1,
            materialImage: 1,
            frontAltText: 1,
            backAltText: 1,
            leftAltText: 1,
            rightAltText: 1,
            materialAltText: 1
          }
        }
      ]
      
      // Get total count for pagination info
      const countPipeline = [
        { $match: matchConditions },
        { $count: "total" }
      ]
      
      const [countResult] = await collection.aggregate(countPipeline).toArray()
      const total = countResult?.total || 0
      
      // Get paginated data
      const products = await collection.aggregate(pipeline).toArray() as Product[]
      
      console.log('🔍 [ProductService] Aggregation results:', {
        pipelineLength: pipeline.length,
        productsReturned: products.length,
        firstProduct: products[0]?.name,
        productsSample: products.slice(0, 2).map(p => ({ id: p.id, name: p.name }))
      })
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit)
      const hasNext = page < totalPages
      const hasPrev = page > 1
      
      console.log('📊 [ProductService] Pagination results:', {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNext,
        hasPrev,
        productsCount: products.length
      })
      
      return {
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      }
    } catch (error) {
      console.error('❌ [ProductService] Error in paginated query:', error)
      throw error
    }
  }

  static async getAllProducts(): Promise<Product[]> {
    const collection = await this.getCollection()
    const products = await collection.find({}).toArray()

    return products.map((product) => ({
      id: product._id!.toString(),
      name: product.name,
      price: product.price,
      image: product.image,
      categoryId: product.categoryId,
      subcategoryIds: product.subcategoryIds,
      description: product.description,
      inStock: product.inStock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      hasVariations: product.hasVariations,
      variations: product.variations,
      eligibleForCoupons: product.eligibleForCoupons,
      type: product.type,
      baseColor: product.baseColor,
      angles: product.angles,
      colors: product.colors,
      purchaseLimit: product.purchaseLimit, // Add purchase limit data
      // Include individual angle images for single products
      frontImage: product.frontImage,
      backImage: product.backImage,
      leftImage: product.leftImage,
      rightImage: product.rightImage,
      materialImage: product.materialImage,
      frontAltText: product.frontAltText,
      backAltText: product.backAltText,
      leftAltText: product.leftAltText,
      rightAltText: product.rightAltText,
      materialAltText: product.materialAltText,
    }))
  }

  static async getProductById(id: string): Promise<Product | null> {
    const collection = await this.getCollection()
    const product = await collection.findOne({ _id: new ObjectId(id) })

    if (!product) return null

    // Debug: Log what's actually in the database
    console.log('🔍 [ProductService] Raw database product:', {
      id: product._id?.toString(),
      name: product.name,
      hasPurchaseLimit: !!product.purchaseLimit,
      purchaseLimit: product.purchaseLimit,
      purchaseLimitKeys: product.purchaseLimit ? Object.keys(product.purchaseLimit) : [],
      allKeys: Object.keys(product),
      // Debug individual angle images
      individualImages: {
        frontImage: product.frontImage,
        backImage: product.backImage,
        leftImage: product.leftImage,
        rightImage: product.rightImage,
        materialImage: product.materialImage
      },
      angles: product.angles,
      hasVariations: product.hasVariations
    })

    return {
      id: product._id!.toString(),
      name: product.name,
      price: product.price,
      image: product.image,
      categoryId: product.categoryId,
      subcategoryIds: product.subcategoryIds,
      description: product.description,
      inStock: product.inStock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      hasVariations: product.hasVariations,
      variations: product.variations,
      eligibleForCoupons: product.eligibleForCoupons,
      type: product.type,
      baseColor: product.baseColor,
      angles: product.angles,
      colors: product.colors,
      purchaseLimit: product.purchaseLimit, // Add purchase limit data
      // Include individual angle images for single products
      frontImage: product.frontImage,
      backImage: product.backImage,
      leftImage: product.leftImage,
      rightImage: product.rightImage,
      materialImage: product.materialImage,
      frontAltText: product.frontAltText,
      backAltText: product.backAltText,
      leftAltText: product.leftAltText,
      rightAltText: product.rightAltText,
      materialAltText: product.materialAltText,
    }
  }

  static async updateProduct(
    id: string,
    productData: Partial<Omit<ProductDocument, "createdAt" | "_id">>,
  ): Promise<Product | null> {
    const collection = await this.getCollection()

    const res = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...productData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    const result = (res as any)?.value ?? (res as any) // support driver variations
    if (!result) return null

    return {
      id: result._id!.toString(),
      name: result.name,
      price: result.price,
      image: result.image,
      categoryId: result.categoryId,
      subcategoryIds: result.subcategoryIds,
      description: result.description,
      inStock: result.inStock,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      hasVariations: result.hasVariations,
      variations: result.variations,
      eligibleForCoupons: result.eligibleForCoupons,
      type: result.type,
      baseColor: result.baseColor,
      angles: result.angles,
      colors: result.colors,
      purchaseLimit: result.purchaseLimit, // Add purchase limit data
      // Include individual angle images for single products
      frontImage: result.frontImage,
      backImage: result.backImage,
      leftImage: result.leftImage,
      rightImage: result.rightImage,
      materialImage: result.materialImage,
      frontAltText: result.frontAltText,
      backAltText: result.backAltText,
      leftAltText: result.leftAltText,
      rightAltText: result.rightAltText,
      materialAltText: result.materialAltText,
    }
  }

  static async deleteProduct(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
  }
}
