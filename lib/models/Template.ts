export interface TemplateDocument {
  _id?: string
  id: string
  name: string
  image: string
  price: number | "free"
  category: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Template {
  id: string
  name: string
  image: string
  price: number | "free"
  category: string
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateTemplateData {
  name: string
  image: string
  price: number | "free"
  category: string
}

export interface UpdateTemplateData {
  id: string
  name?: string
  image?: string
  price?: number | "free"
  category?: string
} 