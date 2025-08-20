import { getDatabase } from "@/lib/mongodb"
import type { DesignDocument, Design } from "@/lib/models/Design"
import { ObjectId } from "mongodb"

export class DesignService {
  private static async getCollection() {
    const db = await getDatabase()
    return db.collection<DesignDocument>("designs")
  }

  static async createDesign(designData: Omit<DesignDocument, "_id" | "createdAt" | "updatedAt">): Promise<Design> {
    const collection = await this.getCollection()

    const newDesign: DesignDocument = {
      ...designData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(newDesign)

    return {
      id: result.insertedId.toString(),
      ...designData,
    }
  }

  static async getDesignsByUserId(userId: string): Promise<Design[]> {
    const collection = await this.getCollection()
    const designs = await collection.find({ userId }).sort({ updatedAt: -1 }).toArray()

    return designs.map((design) => ({
      id: design._id!.toString(),
      name: design.name,
      type: design.type,
      preview: design.preview,
      userId: design.userId,
      designData: design.designData,
      status: design.status,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    }))
  }

  static async getDesignById(id: string): Promise<Design | null> {
    const collection = await this.getCollection()
    const design = await collection.findOne({ _id: new ObjectId(id) })

    if (!design) return null

    return {
      id: design._id!.toString(),
      name: design.name,
      type: design.type,
      preview: design.preview,
      userId: design.userId,
      designData: design.designData,
      status: design.status,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    }
  }

  static async updateDesign(
    id: string,
    designData: Partial<Omit<DesignDocument, "createdAt">>,
  ): Promise<Design | null> {
    const collection = await this.getCollection()

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...designData,
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

  static async deleteDesign(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
  }
}
