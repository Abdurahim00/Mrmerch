import { NextRequest, NextResponse } from "next/server"
import { updateSubcategory, deleteSubcategory } from "@/lib/services/categoryService"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json()
    const updated = await updateSubcategory(params.id, data)
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e: any) {
    const status = e.message?.includes("exists") ? 400 : 500
    return NextResponse.json({ error: e.message || "Failed to update" }, { status })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ok = await deleteSubcategory(params.id)
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to delete" }, { status: 500 })
  }
}

