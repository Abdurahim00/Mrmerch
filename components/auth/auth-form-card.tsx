import type React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

interface AuthFormCardProps {
  title: string
  children: React.ReactNode
  footerContent?: React.ReactNode
}

export function AuthFormCard({ title, children, footerContent }: AuthFormCardProps) {
  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-xl bg-white dark:bg-slate-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footerContent && <CardFooter className="text-center text-sm justify-center">{footerContent}</CardFooter>}
      </Card>
    </div>
  )
}
