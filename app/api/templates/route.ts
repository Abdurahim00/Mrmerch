import { NextRequest, NextResponse } from "next/server"
import { TemplateService } from "@/lib/services/templateService"
import type { CreateTemplateData } from "@/lib/models/Template"

const templateService = new TemplateService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    let templates

    if (search) {
      templates = await templateService.searchTemplates(search)
    } else if (category && category !== "all") {
      templates = await templateService.getTemplatesByCategory(category)
    } else {
      templates = await templateService.getAllTemplates()
    }

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: CreateTemplateData = await request.json()

    // Validate required fields
    if (!data.name || !data.category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      )
    }

    // Set default image if not provided
    if (!data.image) {
      data.image = "/placeholder.svg?height=200&width=200&text=Template"
    }

    // Set default price if not provided
    if (data.price === undefined) {
      data.price = "free"
    }

    const template = await templateService.createTemplate(data)

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    )
  }
} 