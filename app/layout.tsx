import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ReduxProvider } from "@/components/providers/redux-provider"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Toaster } from "sonner"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { CustomSessionProvider } from "@/components/providers/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PrintWrap Pro - Professional Printing & Car Wrapping",
  description: "High-quality custom prints and professional car wrapping services in Sweden",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions as any)

  return (
    <html lang="en">
      <body className={inter.className}>
        <CustomSessionProvider session={session as any}>
          {" "}
          {/* Wrap with SessionProvider */}
          <ReduxProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-slate-200 font-sans">
              <Navbar />
              <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <UserIdBridge />
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
          </ReduxProvider>
        </CustomSessionProvider>
      </body>
    </html>
  )
}

// Bridge current user id into window so autosave keys are per-user
function UserIdBridge() {
  if (typeof window !== 'undefined') {
    try {
      const el = document.getElementById('__current_user_meta__')
      const uid = el?.getAttribute('data-uid') || 'guest'
      ;(window as any).__CURRENT_USER_ID__ = uid
    } catch {}
  }
  return (
    <div id="__current_user_meta__" data-uid="" style={{ display: 'none' }} />
  )
}
