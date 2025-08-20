"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, ImageIcon, FileText, Loader2 } from "lucide-react"
import { useFabricCanvas } from "@/hooks/useFabricCanvas"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/lib/redux/store"
import { addImageLayer } from "@/lib/redux/designToolSlices/designSlice"
import { ImagePropertiesPanel } from "./image-properties"

export function UploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addImage } = useFabricCanvas("design-canvas")
  const { fabricCanvas, selectedObject } = useSelector((state: RootState) => state.canvas as any)
  const [isUploading, setIsUploading] = useState(false)
  const dispatch = useDispatch()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await handleDroppedFile(file)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        // Handle the dropped file directly
        handleDroppedFile(file)
      } else {
        alert('Please drop an image file')
      }
    }
  }

  const handleDroppedFile = async (file: File) => {
    if (!fabricCanvas) {
      console.warn("Fabric canvas not yet initialized. Cannot upload image.")
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, SVG, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        if (imageUrl && fabricCanvas) {
          // Add the image directly to the Fabric canvas
          addImage(fabricCanvas, imageUrl, {
            isTemplate: false, // Flag that it's an uploaded image, not a template
          })
          
          // Still keep track in Redux state for persistence
          dispatch(addImageLayer({
            id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            src: imageUrl,
            type: "upload",
            name: file.name,
          }))
        }
        setIsUploading(false)
      }

      reader.onerror = () => {
        alert('Error reading file. Please try again.')
        setIsUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file. Please try again.')
      setIsUploading(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <Card 
        className="border-dashed border-2 border-gray-300 rounded-xl hover:border-blue-400 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-6">
          {isUploading ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-sm text-gray-600 text-center mb-4">Uploading image...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 text-center mb-4">
                Drag and drop your image here or click to select
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <Button 
                variant="outline" 
                className="rounded-xl bg-transparent" 
                onClick={handleUploadClick}
                disabled={!fabricCanvas}
              >
                Choose Image
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-medium text-sm">Supported File Types</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ImageIcon className="w-4 h-4" />
            <span>Images: JPG, PNG, SVG, GIF, WebP</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>Maximum file size: 5MB</span>
          </div>
        </div>
      </div>

      {!fabricCanvas && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            Canvas is initializing. Please wait a moment before uploading images.
          </p>
        </div>
      )}

      {fabricCanvas && selectedObject && selectedObject.type === 'image' && (
        <ImagePropertiesPanel />
      )}
    </div>
  )
}

