import { type NextRequest, NextResponse } from "next/server"
import { OrderService } from "@/lib/services/orderService"

export async function GET() {
  try {
    const orders = await OrderService.getAllOrders()
    return NextResponse.json(orders)
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    const orderId = `ORD-${String(Date.now()).slice(-6)}` // Simple unique ID
    const newOrder = await OrderService.createOrder({
      orderId,
      date: new Date().toISOString().split("T")[0],
      status: "Queued",
      ...orderData,
    })

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
