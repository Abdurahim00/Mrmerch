import { NextResponse } from "next/server"
import { UserService } from "@/lib/services/userService"

export async function GET() {
  try {
    const users = await UserService.getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
