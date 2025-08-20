import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"
import { UserService } from "@/lib/services/userService"

export const authOptions = {
  adapter: process.env.MONGODB_URI ? MongoDBAdapter(clientPromise) : undefined,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await UserService.findUserByEmail(credentials.email)

          if (user && user.password === credentials.password) {
            // In a real application, you would hash passwords and compare them securely.
            // For example: const isValid = await bcrypt.compare(credentials.password, user.password);
            // If (user && isValid) { ... }
            const { password, ...userWithoutPassword } = user
            return {
              id: user._id ? user._id.toString() : "",
              email: user.email,
              role: user.role,
              customerNumber: user.customerNumber,
              fullName: user.fullName,
              phone: user.phone,
              address: user.address,
              city: user.city,
              postalCode: user.postalCode,
              country: user.country,
            }
          }
          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.customerNumber = user.customerNumber
        token.fullName = user.fullName
        token.phone = user.phone
        token.address = user.address
        token.city = user.city
        token.postalCode = user.postalCode
        token.country = user.country
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.customerNumber = token.customerNumber
        session.user.fullName = token.fullName
        session.user.phone = token.phone
        session.user.address = token.address
        session.user.city = token.city
        session.user.postalCode = token.postalCode
        session.user.country = token.country
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login", // Error code passed in query string
  },
}


