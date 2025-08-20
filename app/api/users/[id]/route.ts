import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/userService"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userData = await request.json()

    const updatedUser = await UserService.updateUser(params.id, userData)

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = await UserService.deleteUser(params.id)

    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
