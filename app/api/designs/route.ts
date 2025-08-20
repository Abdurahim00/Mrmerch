import { NextRequest, NextResponse } from "next/server"
import { DesignService } from "@/lib/services/designService"

export async function GET(request: NextRequest) {
  try {
    // Get userId from query parameter
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }
    
    const designs = await DesignService.getDesignsByUserId(userId)
    return NextResponse.json(designs)
  } catch (error) {
    console.error("Error fetching designs:", error)
    return NextResponse.json(
      { error: "Failed to fetch designs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const design = await DesignService.createDesign(body)
    return NextResponse.json(design, { status: 201 })
  } catch (error) {
    console.error("Error creating design:", error)
    return NextResponse.json(
      { error: "Failed to create design" },
      { status: 500 }
    )
  }
}
