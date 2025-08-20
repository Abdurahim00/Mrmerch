import { getDatabase } from "@/lib/mongodb"
import type { CartDocument, UserCart } from "@/lib/models/Cart"

export class CartService {
  private static async getCollection() {
    const db = await getDatabase()
    return db.collection<CartDocument>("carts")
  }

  static async getCartByUserId(userId: string): Promise<UserCart | null> {
    const collection = await this.getCollection()
    const found = await collection.findOne({ userId })
    if (!found) return null
    const { _id, ...rest } = found
    return rest
  }

  static async upsertCart(userId: string, items: UserCart["items"]): Promise<UserCart> {
    const collection = await this.getCollection()
    const now = new Date()
    const result = await collection.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          items,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: "after" },
    )
    // result can be the raw doc in mongodb driver v5 findOneAndUpdate
    const doc = (result as any) as CartDocument
    const { _id, ...rest } = doc
    return rest
  }
}


