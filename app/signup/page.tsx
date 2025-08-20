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
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { signIn } from "next-auth/react" // Import signIn

export default function SignupPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { loading, error } = useAppSelector((state) => state.auth)
  const { language } = useAppSelector((state) => state.app)
  const { toast } = useToast()
  const t = translations[language]

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [validationError, setValidationError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")
    dispatch(clearError())
    setIsSubmitting(true)

    if (password !== confirmPassword) {
      setValidationError(t.passwordsDoNotMatch)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.error === "User already exists") {
          setValidationError(t.userAlreadyExists)
        } else {
          throw new Error(data.error || t.failedToCreateAccount)
        }
        return
      }

      // If signup is successful, automatically sign in the user
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast({
          title: t.loginFailed,
          description: t.invalidCredentials,
          variant: "destructive",
        })
      } else {
        toast({
          title: t.accountCreated,
          description: t.welcomeToPlatform,
          variant: "success",
        })
        router.push("/dashboard")
      }
    } catch (err: any) {
      toast({
        title: t.signupFailed,
        description: err.message || t.failedToCreateAccount,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFormCard
      title={t.signup}
      footerContent={
        <p>
          {t.alreadyHaveAccount}{" "}
          <Button
            variant="link"
            className="p-0 text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-500"
            asChild
          >
            <Link href="/login">{t.login}</Link>
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
        <div className="space-y-1">
          <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        {(error || validationError) && (
          <p className="text-sm text-red-600 dark:text-red-400">{error || validationError}</p>
        )}
        <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white" disabled={isSubmitting}>
          {isSubmitting ? t.creatingAccount : t.signup}
        </Button>
      </form>
    </AuthFormCard>
  )
}
