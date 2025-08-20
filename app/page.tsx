"use client"

import { useAppSelector } from "@/lib/redux/hooks"
import { translations } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Palette, Package } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { language } = useAppSelector((state) => state.app)
  const t = translations[language]

  return (
    <div className="text-center flex flex-col items-center justify-center py-12 md:py-24">
      <Badge
        variant="secondary"
        className="mb-4 bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900 dark:text-sky-300 dark:border-sky-700"
      >
        {t.platformName}
      </Badge>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
        {t.homepageTitle}
      </h1>
      <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10">
        {t.homepageSubtitle}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button size="lg" asChild className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg">
          <Link href="/design-tool" className="flex items-center">
            <Palette className="mr-2 h-5 w-5" /> {t.startDesigning}
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild className="shadow-lg bg-transparent">
          <Link href="/products" className="flex items-center">
            <Package className="mr-2 h-5 w-5" /> {t.viewProducts}
          </Link>
        </Button>
      </div>
    </div>
  )
}
