import type { ObjectId } from "mongodb"

export interface DesignProductDocument {
  _id?: ObjectId
  name: string
  type: string
  baseColor: string
  angles: string[]
  colors: string[]
  price: string
  image: string
  description?: string
  inStock: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DesignProduct {
  id: string
  name: string
  type: string
  baseColor: string
  angles: string[]
  colors: string[]
  price: string
  image: string
  description?: string
  inStock: boolean
  createdAt?: Date
  updatedAt?: Date
} 