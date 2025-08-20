import { getDatabase } from "@/lib/mongodb"
import type { DesignDocument, Design } from "@/lib/models/Design"
import { ObjectId } from "mongodb"

export class DesignProductService {
  private static async getCollection() {
    const db = await getDatabase()
    return db.collection<DesignDocument>("designs")
  }

  static async createDesignProduct(productData: Omit<DesignDocument, "_id" | "createdAt" | "updatedAt">): Promise<Design> {
    const collection = await this.getCollection()

    const newProduct: DesignDocument = {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(newProduct)

    return {
      id: result.insertedId.toString(),
      ...productData,
    }
  }

  static async getAllDesignProducts(): Promise<Design[]> {
    const collection = await this.getCollection()
    // Get only system-generated design products (templates)
    const products = await collection.find({ userId: "system" }).toArray()

    return products.map((product) => ({
      id: product._id!.toString(),
      name: product.name,
      type: product.type,
      preview: product.preview,
      userId: product.userId,
      designData: product.designData,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }))
  }

  static async getDesignProductById(id: string): Promise<Design | null> {
    const collection = await this.getCollection()
    const product = await collection.findOne({ _id: new ObjectId(id), userId: "system" })

    if (!product) return null

    return {
      id: product._id!.toString(),
      name: product.name,
      type: product.type,
      preview: product.preview,
      userId: product.userId,
      designData: product.designData,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }
  }

  static async updateDesignProduct(
    id: string,
    productData: Partial<Omit<DesignDocument, "createdAt">>,
  ): Promise<Design | null> {
    const collection = await this.getCollection()

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId: "system" },
      {
        $set: {
          ...productData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result) return null

    return {
      id: result._id!.toString(),
      name: result.name,
      type: result.type,
      preview: result.preview,
      userId: result.userId,
      designData: result.designData,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }
  }

  static async deleteDesignProduct(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ _id: new ObjectId(id), userId: "system" })
    return result.deletedCount > 0
  }
} 