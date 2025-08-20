import { getDatabase } from "@/lib/mongodb"
import type { UserDocument, User } from "@/lib/models/User"
import { ObjectId } from "mongodb"

export class UserService {
  private static async getCollection() {
    const db = await getDatabase()
    return db.collection<UserDocument>("users")
  }

  static async createUser(userData: Omit<UserDocument, "_id" | "createdAt" | "updatedAt">): Promise<User> {
    const collection = await this.getCollection()

    const newUser: UserDocument = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(newUser)

    return {
      id: result.insertedId.toString(),
      email: newUser.email,
      role: newUser.role,
      customerNumber: newUser.customerNumber,
      fullName: newUser.fullName,
      phone: newUser.phone,
      address: newUser.address,
      city: newUser.city,
      postalCode: newUser.postalCode,
      country: newUser.country,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    }
  }

  static async findUserByEmail(email: string): Promise<UserDocument | null> {
    const collection = await this.getCollection()
    const user = await collection.findOne({ email })
    return user
  }

  static async getAllUsers(): Promise<User[]> {
    const collection = await this.getCollection()
    const users = await collection.find({}).toArray()

    return users.map((user) => ({
      id: user._id!.toString(),
      email: user.email,
      role: user.role,
      customerNumber: user.customerNumber,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))
  }

  static async updateUser(id: string, userData: Partial<Omit<UserDocument, "createdAt">>): Promise<User | null> {
    const collection = await this.getCollection()

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...userData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result) return null

    return {
      id: result._id!.toString(),
      email: result.email,
      role: result.role,
      customerNumber: result.customerNumber,
      fullName: result.fullName,
      phone: result.phone,
      address: result.address,
      city: result.city,
      postalCode: result.postalCode,
      country: result.country,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }
  }

  static async deleteUser(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
  }
}
