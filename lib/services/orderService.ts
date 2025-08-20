import { getDatabase } from "@/lib/mongodb"
import type { OrderDocument, Order } from "@/lib/models/Order"

export class OrderService {
  private static async getCollection() {
    const db = await getDatabase()
    return db.collection<OrderDocument>("orders")
  }

  static async createOrder(orderData: Omit<OrderDocument, "_id" | "createdAt" | "updatedAt">): Promise<Order> {
    const collection = await this.getCollection()

    const newOrder: OrderDocument = {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(newOrder)

      return {
        id: newOrder.orderId, // Use the generated orderId as the public ID
        customer: newOrder.customer,
        date: newOrder.date,
        total: newOrder.total,
        status: newOrder.status,
        items: newOrder.items,
        shippingOption: newOrder.shippingOption,
        paymentMethod: newOrder.paymentMethod,
        paymentIntentId: newOrder.paymentIntentId,
        customerName: newOrder.customerName,
        customerEmail: newOrder.customerEmail,
        customerPhone: newOrder.customerPhone,
        customerAddress: newOrder.customerAddress,
        customerCity: newOrder.customerCity,
        customerPostalCode: newOrder.customerPostalCode,
        customerCountry: newOrder.customerCountry,
        createdAt: newOrder.createdAt,
        updatedAt: newOrder.updatedAt,
      }
  }

  static async getAllOrders(): Promise<Order[]> {
    const collection = await this.getCollection()
    const orders = await collection.find({}).sort({ createdAt: -1 }).toArray()

    return orders.map((order) => ({
      id: order.orderId,
      customer: order.customer,
      date: order.date,
      total: order.total,
      status: order.status,
      items: order.items,
      shippingOption: order.shippingOption,
      paymentMethod: order.paymentMethod,
      paymentIntentId: order.paymentIntentId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      customerCity: order.customerCity,
      customerPostalCode: order.customerPostalCode,
      customerCountry: order.customerCountry,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }))
  }

  static async getOrderById(orderId: string): Promise<Order | null> {
    const collection = await this.getCollection()
    const order = await collection.findOne({ orderId })

    if (!order) return null

    return {
      id: order.orderId,
      customer: order.customer,
      date: order.date,
      total: order.total,
      status: order.status,
      items: order.items,
      shippingOption: order.shippingOption,
      paymentMethod: order.paymentMethod,
      paymentIntentId: order.paymentIntentId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      customerCity: order.customerCity,
      customerPostalCode: order.customerPostalCode,
      customerCountry: order.customerCountry,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }
  }

  static async updateOrderStatus(orderId: string, status: OrderDocument["status"]): Promise<Order | null> {
    const collection = await this.getCollection()

    const result = await collection.findOneAndUpdate(
      { orderId },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result) return null

    return {
      id: result.orderId,
      customer: result.customer,
      date: result.date,
      total: result.total,
      status: result.status,
      items: result.items,
      shippingOption: result.shippingOption,
      paymentMethod: result.paymentMethod,
      paymentIntentId: result.paymentIntentId,
      customerName: result.customerName,
      customerEmail: result.customerEmail,
      customerPhone: result.customerPhone,
      customerAddress: result.customerAddress,
      customerCity: result.customerCity,
      customerPostalCode: result.customerPostalCode,
      customerCountry: result.customerCountry,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }
  }

  static async deleteOrder(orderId: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ orderId })
    return result.deletedCount > 0
  }
}
