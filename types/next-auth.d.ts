declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: "user" | "admin" | "operations"
      customerNumber: string
      fullName?: string
      phone?: string
      address?: string
      city?: string
      postalCode?: string
      country?: string
    }
  }

  interface User {
    id: string
    email: string
    role: "user" | "admin" | "operations"
    customerNumber: string
    fullName?: string
    phone?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    role: "user" | "admin" | "operations"
    customerNumber: string
    fullName?: string
    phone?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
  }
}
