"use client"
import { ImageIcon } from "lucide-react"
import { ImagePropertiesPanel } from "./image-properties"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/redux/store"

export function TemplatePanel() {
  const selected = useSelector((s: RootState) => (s.canvas as any).selectedObject)
  const isImage = selected && selected.type === "image"

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {isImage ? (
        <ImagePropertiesPanel />
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mb-4 text-gray-300" />
          <p className="text-center">Select a template image on canvas to edit properties</p>
        </div>
      )}
    </div>
  )
}
