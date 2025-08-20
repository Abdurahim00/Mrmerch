"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { clearError } from "@/lib/redux/slices/authSlice"
import { translations } from "@/lib/constants"
import { AuthFormCard } from "@/components/auth/auth-form-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { signIn } from "next-auth/react" // Import signIn

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { loading, error } = useAppSelector((state) => state.auth)
  const { language } = useAppSelector((state) => state.app)
  const { toast } = useToast()
  const t = translations[language]

  const [email, setEmail] = useState("user@example.com")
  const [password, setPassword] = useState("password")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(clearError())
    setIsSubmitting(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Prevent NextAuth from redirecting automatically
      })

      if (result?.error) {
        toast({
          title: t.loginFailed,
          description: t.invalidCredentials,
          variant: "destructive",
        })
      } else {
        toast({
          title: t.welcomeBack,
          description: t.loggedInSuccessfully,
          variant: "success",
        })
        router.push("/dashboard")
      }
    } catch (err) {
      toast({
        title: t.loginFailed,
        description: t.invalidCredentials,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const demoAccounts = [
    { email: "user@example.com", role: "User", description: "Regular user with order history and design management" },
    { email: "admin@example.com", role: "Admin", description: "Full admin access with user and product management" },
    { email: "ops@example.com", role: "Operations", description: "Operations dashboard with order queue management" },
  ]

  return (
    <div className="space-y-6">
      <AuthFormCard
        title={t.login}
        footerContent={
          <p>
            {t.dontHaveAccount}{" "}
            <Button
              variant="link"
              className="p-0 text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-500"
              asChild
            >
              <Link href="/signup">{t.signup}</Link>
            </Button>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white" disabled={isSubmitting}>
            {isSubmitting ? t.loggingIn : t.login}
          </Button>
        </form>
      </AuthFormCard>

      {/* Demo Accounts */}
      <Card className="max-w-md mx-auto shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-center text-lg text-slate-900 dark:text-white">Demo Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoAccounts.map((account) => (
            <div
              key={account.email}
              className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              onClick={() => {
                setEmail(account.email)
                setPassword("password")
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-slate-900 dark:text-white">{account.email}</span>
                <span className="text-xs px-2 py-1 bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200 rounded">
                  {account.role}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{account.description}</p>
            </div>
          ))}
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3">
            Click any account to auto-fill credentials. Password: "password"
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
