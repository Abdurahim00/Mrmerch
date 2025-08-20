import NextAuth from "next-auth/next"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// POST function remains unchanged as per the updates
// export async function POST(request: NextRequest) {
//   try {
//     const { email, password } = await request.json()

//     const user = await UserService.findUserByEmail(email)

//     if (!user || user.password !== password) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
//     }

//     // In a real app, you'd generate a JWT token here
//     const { password: _, ...userWithoutPassword } = user

//     return NextResponse.json({
//       user: userWithoutPassword,
//       message: "Login successful",
//     })
//   } catch (error) {
//     console.error("Login error:", error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }
