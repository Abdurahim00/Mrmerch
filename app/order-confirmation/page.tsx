"use client"

import { useAppSelector } from "@/lib/redux/hooks"
import { translations } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShieldCheck, Package } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

export default function OrderConfirmationPage() {
  const { language } = useAppSelector((state) => state.app)
  const t = translations[language]
  const { data: session } = useSession()

  return (
    <div className="flex items-center justify-center py-20 px-4 min-h-[calc(100vh-200px)] bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div
        className="w-full max-w-2xl"
      >
        <Card className="rounded-2xl shadow-2xl border-0 bg-white dark:bg-slate-900">
          <CardHeader className="text-center px-10 pt-10">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full shadow-inner">
                <ShieldCheck className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.orderConfirmation}
            </CardTitle>
            <CardDescription className="text-md md:text-lg text-slate-600 dark:text-slate-300 mt-2">
              🎉 {t.thankYouForOrder}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-10 pt-4 pb-6 space-y-4">
            {session?.user ? (
              <p className="text-center text-slate-700 dark:text-slate-300 text-base font-medium">
                {t.trackOrderStatus} in your dashboard.
              </p>
            ) : (
              <div className="text-center bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  {t.trackOrderStatusSignIn}
                </p>
                <Button asChild variant="link" className="text-blue-700 dark:text-blue-300 mt-1">
                  <Link href="/login">{t.login} →</Link>
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-4 px-10 pb-10">
            <Button
              asChild
              className="w-full text-lg py-3 px-6 bg-sky-600 hover:bg-sky-700 text-white shadow-lg"
            >
              <Link href="/products" className="flex items-center justify-center">
                <Package className="mr-2 h-5 w-5" />
                {t.exploreMoreProducts}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full text-lg py-3 px-6 border-slate-300 dark:border-slate-600 shadow"
            >
              <Link href="/" className="flex items-center justify-center">
                {t.backToHome}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
