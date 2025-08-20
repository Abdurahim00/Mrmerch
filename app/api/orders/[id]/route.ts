import { type NextRequest, NextResponse } from "next/server"
import { OrderService } from "@/lib/services/orderService"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()

    const updatedOrder = await OrderService.updateOrderStatus(params.id, status)

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
