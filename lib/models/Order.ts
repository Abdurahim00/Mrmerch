import type { ObjectId } from "mongodb"

export interface OrderDocument {
  _id?: ObjectId
  orderId: string
  customer: string // customerNumber
  date: string
  total: number
  status: "Queued" | "Printing" | "In Production" | "Shipped" | "Completed"
  items: Array<{
    name: string
    quantity: number
    price: number
    size?: string
    designPreview?: string
    designId?: string
    selectedSizes?: any
    designContext?: any
    designCanvasJSON?: any
    productId?: string
  }>
  shippingOption: "standard" | "express"
  paymentMethod: "card" | "swish" | "klarna"
  paymentIntentId?: string
  // Customer information
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  customerCity?: string
  customerPostalCode?: string
  customerCountry?: string
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string // orderId
  customer: string
  date: string
  total: number
  status: "Queued" | "Printing" | "In Production" | "Shipped" | "Completed"
  items: Array<{
    name: string
    quantity: number
    price: number
    size?: string
    designPreview?: string
    designId?: string
  }>
  shippingOption: "standard" | "express"
  paymentMethod: "card" | "swish" | "klarna"
  paymentIntentId?: string
  // Customer information
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  customerCity?: string
  customerPostalCode?: string
  customerCountry?: string
  createdAt?: Date
  updatedAt?: Date
}
