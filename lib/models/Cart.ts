import type { ObjectId } from "mongodb"
import type { CartItem } from "@/types"

export interface CartDocument {
  _id?: ObjectId
  userId: string // MongoDB user _id as string
  items: CartItem[]
  createdAt: Date
  updatedAt: Date
}

export interface UserCart {
  userId: string
  items: CartItem[]
  createdAt?: Date
  updatedAt?: Date
}


