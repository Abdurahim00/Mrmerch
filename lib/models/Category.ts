import type { ObjectId } from "mongodb"

export interface CategoryDocument {
  _id?: ObjectId
  name: string
  slug: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SubcategoryDocument {
  _id?: ObjectId
  categoryId: ObjectId
  name: string
  slug: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

