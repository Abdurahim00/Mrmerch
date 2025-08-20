import type { ObjectId } from "mongodb"

export interface UserDocument {
  _id?: ObjectId
  email: string
  password: string // In a real app, this should be hashed
  role: "user" | "admin" | "operations"
  customerNumber: string
  fullName?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  role: "user" | "admin" | "operations"
  customerNumber: string
  fullName?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  createdAt?: Date
  updatedAt?: Date
}
