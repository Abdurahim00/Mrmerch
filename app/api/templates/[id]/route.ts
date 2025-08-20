import { NextRequest, NextResponse } from "next/server"
import { TemplateService } from "@/lib/services/templateService"
import type { UpdateTemplateData } from "@/lib/models/Template"

const templateService = new TemplateService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await templateService.getTemplateById(params.id)

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error fetching template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: UpdateTemplateData = await request.json()
    data.id = params.id

    const template = await templateService.updateTemplate(data)

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await templateService.deleteTemplate(params.id)

    if (!success) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Template deleted successfully" })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
} 