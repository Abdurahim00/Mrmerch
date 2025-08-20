"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Trash2,
  Copy,
  RotateCcw,
  Undo2,
  Target,
  Square,
} from "lucide-react"
import { useFabricCanvas } from "@/hooks/useFabricCanvas"
import { RootState } from "@/lib/redux/store"

export function TextPanel() {
  const { selectedObject, fabricCanvas } = useSelector((state: RootState) => state.canvas)
  const { selectedTool } = useSelector((state: RootState) => state.design)
  const { updateTextProperties, deleteSelected, duplicateSelected, getTextScalingInfo, bendText, getTextBendAmount } = useFabricCanvas("design-canvas")

  const [textProperties, setTextProperties] = useState({
    text: "",
    fontSize: 24,
    fontFamily: "Arial",
    fill: "#000000", // Default text color set to black for visibility
    fontWeight: "normal",
    fontStyle: "normal",
    underline: false,
    textAlign: "left",
  })

  const [scalingInfo, setScalingInfo] = useState<{
    currentFontSize: number
    minFontSize: number
    maxFontSize: number
    scaleX: number
    scaleY: number
  } | null>(null)

  const [bendAmount, setBendAmount] = useState(0)

  // Update local state when selected object changes
  useEffect(() => {
    if (selectedObject && (selectedObject.type === "text" || selectedObject.type === "i-text")) {
      setTextProperties({
        text: selectedObject.text || "",
        fontSize: selectedObject.fontSize || 24,
        fontFamily: selectedObject.fontFamily || "Arial",
        fill: selectedObject.fill || "#000000", // Ensure this matches the new default
        fontWeight: selectedObject.fontWeight || "normal",
        fontStyle: selectedObject.fontStyle || "normal",
        underline: selectedObject.underline || false,
        textAlign: selectedObject.textAlign || "left",
      })
      
      // Get scaling information
      if (fabricCanvas) {
        const info = getTextScalingInfo(fabricCanvas)
        setScalingInfo(info)
        
        // Get current bend amount
        const currentBend = getTextBendAmount(fabricCanvas)
        setBendAmount(currentBend)
      }
    } else {
      setScalingInfo(null)
      setBendAmount(0)
    }
  }, [selectedObject, fabricCanvas, getTextScalingInfo])

  // Listen for canvas modifications to update scaling info
  useEffect(() => {
    if (!fabricCanvas) return

    const handleObjectModified = () => {
      if (selectedObject && (selectedObject.type === "text" || selectedObject.type === "i-text")) {
        const info = getTextScalingInfo(fabricCanvas)
        setScalingInfo(info)
        
        // Update text properties if font size changed
        if (info && info.currentFontSize !== textProperties.fontSize) {
          setTextProperties(prev => ({ ...prev, fontSize: info.currentFontSize }))
        }
      }
    }

    fabricCanvas.on('object:modified', handleObjectModified)
    fabricCanvas.on('object:scaling', handleObjectModified)

    return () => {
      fabricCanvas.off('object:modified', handleObjectModified)
      fabricCanvas.off('object:scaling', handleObjectModified)
    }
  }, [fabricCanvas, selectedObject, textProperties.fontSize, getTextScalingInfo])

  const handleTextChange = (value: string) => {
    if (fabricCanvas && selectedObject && (selectedObject.type === "text" || selectedObject.type === "i-text")) {
      const activeObject = fabricCanvas.getActiveObject()
      if (activeObject) {
        activeObject.set("text", value)
        fabricCanvas.requestRenderAll()
        setTextProperties((prev) => ({ ...prev, text: value }))
      }
    }
  }

  const handlePropertyChange = (property: string, value: any) => {
    if (fabricCanvas && selectedObject && (selectedObject.type === "text" || selectedObject.type === "i-text")) {
      updateTextProperties(fabricCanvas, { [property]: value })
      setTextProperties((prev) => ({ ...prev, [property]: value }))
    }
  }

  const handleFontSizeChange = (value: number[]) => {
    handlePropertyChange("fontSize", value[0])
  }

  const handleColorChange = (color: string) => {
    handlePropertyChange("fill", color)
  }

  const handleFontFamilyChange = (fontFamily: string) => {
    handlePropertyChange("fontFamily", fontFamily)
  }

  const handleStyleToggle = (style: string) => {
    let newValue
    if (style === "fontWeight") {
      newValue = textProperties.fontWeight === "bold" ? "normal" : "bold"
    } else if (style === "fontStyle") {
      newValue = textProperties.fontStyle === "italic" ? "normal" : "italic"
    } else if (style === "underline") {
      newValue = !textProperties.underline
    }
    handlePropertyChange(style, newValue)
  }

  const handleAlignChange = (align: string) => {
    handlePropertyChange("textAlign", align)
  }

  const resetText = () => {
    handlePropertyChange("fontSize", 24)
    handlePropertyChange("fontFamily", "Arial")
    handlePropertyChange("fill", "#000000") // Ensure this matches the new default
    handlePropertyChange("fontWeight", "normal")
    handlePropertyChange("fontStyle", "normal")
    handlePropertyChange("underline", false)
    handlePropertyChange("textAlign", "left")
    // Reset bend amount
    if (fabricCanvas) {
      bendText(fabricCanvas, 0)
      setBendAmount(0)
    }
  }

  const handleBendChange = (value: number) => {
    if (fabricCanvas) {
      bendText(fabricCanvas, value)
      setBendAmount(value)
    }
  }

  const enterEditMode = () => {
    if (fabricCanvas && selectedObject && selectedObject.type === "i-text") {
      const activeObject = fabricCanvas.getActiveObject()
      if (activeObject && activeObject.enterEditing) {
        activeObject.enterEditing()
        activeObject.selectAll()
      }
    }
  }

  // Show text controls when text tool is selected or text object is selected
  const showTextControls =
    selectedTool === "text" || (selectedObject && (selectedObject.type === "text" || selectedObject.type === "i-text"))

  if (!showTextControls) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
        <Type className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-center text-sm">Select the Text tool (T) to add and edit text</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 lg:p-4 space-y-3 lg:space-y-4">
        {/* Instructions when text tool is selected but no text is selected */}
        {selectedTool === "text" &&
          (!selectedObject || (selectedObject.type !== "text" && selectedObject.type !== "i-text")) && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-5 mb-6 shadow-sm">
              <div className="flex items-center space-x-3 text-blue-800 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Type className="w-4 h-4" />
                </div>
                <span className="font-semibold">Text Tool Active</span>
              </div>
              <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                Click the Text tool (T) again to add text to your design. Each click creates a new text element that you can customize.
              </p>
              <div className="bg-blue-100/50 rounded-xl p-4 border border-blue-200/40">
                <p className="text-xs text-blue-800 font-semibold mb-2 flex items-center">
                  <span className="text-base mr-2">💡</span>
                  Text Editing Tips:
                </p>
                <ul className="text-xs text-blue-700 space-y-1.5 leading-relaxed">
                  <li>• Drag corner handles to resize while maintaining proportions</li>
                  <li>• Font size adjusts automatically when scaling</li>
                  <li>• Size range: 8px - 200px</li>
                  <li>• Double-click text to edit directly on canvas</li>
                </ul>
              </div>
            </div>
          )}

      {/* Text Input and Controls - Only show when text is selected */}
      {selectedObject && (selectedObject.type === "text" || selectedObject.type === "i-text") && (
        <>
          {/* Text Input */}
          <div className="space-y-2">
            <Input
              value={textProperties.text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Your text here"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center"
            />
          </div>

          {/* Formatting Controls - Single Row */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-1">
              {/* Color picker first */}
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={textProperties.fill}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  title="Text color"
                />
              </div>
              
              {/* Text style buttons */}
              <div className="flex gap-1">
                <Button
                  variant={textProperties.fontWeight === "bold" ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handleStyleToggle("fontWeight")}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant={textProperties.fontStyle === "italic" ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handleStyleToggle("fontStyle")}
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant={textProperties.underline ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handleStyleToggle("underline")}
                >
                  <Underline className="w-4 h-4" />
                </Button>
              </div>

              {/* Alignment buttons */}
              <div className="flex gap-1">
                <Button
                  variant={textProperties.textAlign === "left" ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handleAlignChange("left")}
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant={textProperties.textAlign === "center" ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handleAlignChange("center")}
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button
                  variant={textProperties.textAlign === "right" ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handleAlignChange("right")}
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Font Family - Compact */}
          <div className="space-y-2">
            <Select value={textProperties.fontFamily} onValueChange={handleFontFamilyChange}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Courier New">Courier New</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
                <SelectItem value="Impact">Impact</SelectItem>
                <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Size - Compact */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium flex-shrink-0">Font Size</Label>
              <div className="flex items-center gap-2 flex-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePropertyChange("fontSize", Math.max(textProperties.fontSize - 1, scalingInfo?.minFontSize || 8))}
                  className="w-8 h-8 p-0"
                >
                  −
                </Button>
                <span className="text-sm font-mono min-w-[2rem] text-center">{textProperties.fontSize}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePropertyChange("fontSize", Math.min(textProperties.fontSize + 1, scalingInfo?.maxFontSize || 120))}
                  className="w-8 h-8 p-0"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Color Selection with Slider */}
          <div className="space-y-3">
            <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium inline-block">
              Text Effect
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={bendAmount}
              onChange={(e) => handleBendChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Action Buttons - Compact */}
          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col items-center p-2 h-auto text-xs"
                onClick={resetText}
              >
                <RotateCcw className="w-4 h-4 mb-1" />
                <span className="text-xs">Forward</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col items-center p-2 h-auto text-xs"
                onClick={resetText}
              >
                <Undo2 className="w-4 h-4 mb-1" />
                <span className="text-xs">Back</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col items-center p-2 h-auto text-xs"
                onClick={() => duplicateSelected(fabricCanvas)}
              >
                <Copy className="w-4 h-4 mb-1" />
                <span className="text-xs">Duplicate</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex flex-col items-center p-2 h-auto text-xs"
                onClick={() => deleteSelected(fabricCanvas)}
              >
                <Trash2 className="w-4 h-4 mb-1" />
                <span className="text-xs">Delete</span>
              </Button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  )
}
