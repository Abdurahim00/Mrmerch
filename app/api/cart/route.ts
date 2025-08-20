import { NextRequest, NextResponse } from "next/server"
import { CartService } from "@/lib/services/cartService"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })
  const cart = await CartService.getCartByUserId(userId)
  return NextResponse.json(cart || { userId, items: [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, items } = body
  if (!userId || !Array.isArray(items)) {
    return NextResponse.json({ error: "userId and items required" }, { status: 400 })
  }
  const updated = await CartService.upsertCart(userId, items)
  return NextResponse.json(updated, { status: 200 })
}


