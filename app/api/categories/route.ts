import { NextRequest, NextResponse } from "next/server"
import { createCategory, getCategories } from "@/lib/services/categoryService"

export async function GET() {
  try {
    const categories = await getCategories()
    return NextResponse.json(categories)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const category = await createCategory(body)
    return NextResponse.json(category, { status: 201 })
  } catch (e: any) {
    const status = e.message?.includes("exists") ? 400 : 500
    return NextResponse.json({ error: e.message || "Failed to create category" }, { status })
  }
}

