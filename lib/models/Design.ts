import type { ObjectId } from "mongodb"

export interface DesignDocument {
  _id?: ObjectId
  name: string
  type: string
  preview: string
  userId: string // User's MongoDB _id as string
  designData: any // JSON object storing design elements
  status: "Draft" | "Completed" | "In Review"
  createdAt: Date
  updatedAt: Date
}

export interface Design {
  id: string // MongoDB _id as string
  name: string
  type: string
  preview: string
  userId: string
  designData: any
  status: "Draft" | "Completed" | "In Review"
  createdAt?: Date
  updatedAt?: Date
}
