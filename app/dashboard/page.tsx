"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/redux/hooks"
import { translations } from "@/lib/constants"
import { UserDashboard } from "@/components/dashboard/user-dashboard"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { OperationsDashboard } from "@/components/dashboard/operations-dashboard"
import { useSession } from "next-auth/react" // Import useSession
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession() // Get session data
  const { language } = useAppSelector((state) => state.app)
  const t = translations[language]
  
  // Get tab from URL query parameter
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const defaultTab = searchParams.get('tab') || 'orders'

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Always call hooks at top-level; guard inside the effect
  useEffect(() => {
    const role = (session?.user as any)?.role
    const footer = document.querySelector("footer") as HTMLElement | null
    if (role === "admin" && footer) {
      footer.style.display = "none"
      return () => {
        if (footer) footer.style.display = ""
      }
    }
    return
  }, [session?.user])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    )
  }

  if (status === "unauthenticated" || !session?.user) {
    return null // Redirect handled by useEffect
  }

  const user = session.user as any // extended session with role

  const getDashboardTitle = () => {
    switch (user.role) {
      case "user":
        return t.clientDashboard
      case "admin":
        return t.adminDashboard
      case "operations":
        return t.operationsDashboard
      default:
        return t.dashboard
    }
  }

  const renderDashboardContent = () => {
    switch (user.role) {
      case "user":
        return <UserDashboard defaultTab={defaultTab} />
      case "admin":
        return <AdminDashboard />
      case "operations":
        return <OperationsDashboard />
      default:
        return (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">{t.noDashboardAvailable}</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {renderDashboardContent()}
    </div>
  )
}
