import { type NextRequest, NextResponse } from "next/server"
import { DesignService } from "@/lib/services/designService"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const design = await DesignService.getDesignById(params.id)

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 })
    }

    return NextResponse.json(design)
  } catch (error) {
    console.error("Get design error:", error)
    return NextResponse.json({ error: "Failed to fetch design" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const designData = await request.json()

    const updatedDesign = await DesignService.updateDesign(params.id, designData)

    if (!updatedDesign) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 })
    }

    return NextResponse.json(updatedDesign)
  } catch (error) {
    console.error("Update design error:", error)
    return NextResponse.json({ error: "Failed to update design" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = await DesignService.deleteDesign(params.id)

    if (!deleted) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Design deleted successfully" })
  } catch (error) {
    console.error("Delete design error:", error)
    return NextResponse.json({ error: "Failed to delete design" }, { status: 500 })
  }
}
