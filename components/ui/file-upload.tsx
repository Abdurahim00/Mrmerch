"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useAppSelector } from "@/lib/redux/hooks"
import { translations } from "@/lib/constants"

interface FileUploadProps {
  value?: string
  onChange: (value: string) => void
  accept?: string
  maxSize?: number
  className?: string
  label?: string
  error?: string
}

export function FileUpload({
  value,
  onChange,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
  label,
  error,
}: FileUploadProps) {
  const { language } = useAppSelector((state) => state.app)
  const t = translations[language]

  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string>(value || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      // Handle file size error
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      handleFileSelect(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const removeImage = () => {
    setPreview("")
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging
            ? "border-sky-500 bg-sky-50 dark:bg-sky-950"
            : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500",
          error && "border-red-300 dark:border-red-600",
        )}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
      >
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {preview ? (
          <div className="relative">
            <Image
              src={preview || "/placeholder.svg"}
              alt="Preview"
              width={200}
              height={150}
              className="mx-auto rounded-lg object-cover max-h-40"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={removeImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.dropImageHere}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.imageFormats.replace("{maxSize}", String(Math.round(maxSize / 1024 / 1024)))}
              </p>
            </div>
            <Button type="button" variant="outline" className="mt-4 bg-transparent">
              <Upload className="mr-2 h-4 w-4" />
              {t.chooseFile}
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
