import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/userService"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Check if user already exists
    const existingUser = await UserService.findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Create new user
    const customerNumber = `CUST-${Math.floor(10000 + Math.random() * 90000)}`
    const newUser = await UserService.createUser({
      email,
      password, // In a real app, hash this password before saving
      role: "user",
      customerNumber,
    })

    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      user: userWithoutPassword,
      message: "Signup successful",
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
