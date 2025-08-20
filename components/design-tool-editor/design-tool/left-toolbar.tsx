"use client"

import { useSelector, useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Type, 
  Image, 
  Palette, 
  Shirt, 
  FileText, 
  Upload,
  Settings,
  Layers,
  Undo2,
  Redo2
} from "lucide-react"
import { setSelectedTool, setShowProductModal, setShowTemplateModal } from "@/lib/redux/designToolSlices/designSlice"
import { RootState } from "@/lib/redux/store"
import { useFabricCanvas } from "@/hooks/useFabricCanvas"

export function LeftToolbar() {
  const dispatch = useDispatch()
  const { selectedTool } = useSelector((state: RootState) => state.design)
  const { canUndo, canRedo, fabricCanvas } = useSelector((state: RootState) => state.canvas)
  const { handleUndo, handleRedo, addText } = useFabricCanvas("design-canvas")

  const tools = [
    { id: "product", icon: Shirt, label: "Product", description: "Select and configure products" },
    { id: "text", icon: Type, label: "Text", description: "Add and edit text elements" },
    { id: "template", icon: FileText, label: "Templates", description: "Browse and apply design templates" },
    { id: "upload", icon: Upload, label: "Upload", description: "Upload custom images and graphics" },
    { id: "design-management", icon: Layers, label: "Designs", description: "Manage variation designs" },
  ]

  const handleToolSelect = (toolId: string) => {
    console.log('🛠️ [LeftToolbar] Tool selected:', toolId)
    console.log('🛠️ [LeftToolbar] Current Redux state:', { selectedTool, canUndo, canRedo, fabricCanvas: !!fabricCanvas })
    
    // First, set the selected tool (this visually highlights the tool)
    dispatch(setSelectedTool(toolId))
    
    // Then perform the tool-specific action
    if (toolId === "product") {
      console.log('🛠️ [LeftToolbar] Opening product modal')
      dispatch(setShowProductModal(true))
      console.log('🛠️ [LeftToolbar] Product modal action dispatched')
    } else if (toolId === "template") {
      console.log('🛠️ [LeftToolbar] Opening template modal')
      dispatch(setShowTemplateModal(true))
      console.log('🛠️ [LeftToolbar] Template modal action dispatched')
    } else if (toolId === "text") {
      console.log('🛠️ [LeftToolbar] Adding text to canvas')
      if (fabricCanvas) {
        addText(fabricCanvas) // Pass the fabricCanvas instance
        console.log('🛠️ [LeftToolbar] Text added to canvas')
      } else {
        console.warn("Fabric canvas not yet initialized. Please wait a moment or try again.")
      }
    }
  }

  return (
    <div className="w-16 lg:w-20 bg-white/95 backdrop-blur-sm border-r border-gray-200/80 flex flex-col items-center py-4 lg:py-6 shadow-lg">
      <TooltipProvider>
        {/* Main Tools */}
        <div className="space-y-2 lg:space-y-3">
          {tools.map((tool) => {
            const Icon = tool.icon
            const isSelected = selectedTool === tool.id
            
            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isSelected ? "default" : "ghost"}
                    size="icon"
                    className={`w-11 h-11 lg:w-14 lg:h-14 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md ${
                      isSelected 
                        ? "bg-purple-700 hover:bg-purple-700 text-white shadow-lg scale-105 hover:scale-110" 
                        : "hover:bg-gray-50 hover:scale-105 text-gray-600 hover:text-gray-800"
                    }`}
                    onClick={() => handleToolSelect(tool.id)}
                  >
                    <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700">
                  <p className="font-medium">{tool.label}</p>
                  <p className="text-xs text-gray-300">{tool.description}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        <Separator className="my-4 lg:my-6 w-8 lg:w-10 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* History Controls */}
        <div className="space-y-2 lg:space-y-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-11 h-11 lg:w-14 lg:h-14 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 hover:bg-gray-50 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent text-gray-600 hover:text-gray-800 shadow-sm hover:shadow-md"
                onClick={() => handleUndo(fabricCanvas)}
                disabled={!canUndo || !fabricCanvas}
              >
                <Undo2 className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700">
              <p className="font-medium">Undo (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-11 h-11 lg:w-14 lg:h-14 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 hover:bg-gray-50 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent text-gray-600 hover:text-gray-800 shadow-sm hover:shadow-md"
                onClick={() => handleRedo(fabricCanvas)}
                disabled={!canRedo || !fabricCanvas}
              >
                <Redo2 className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700">
              <p className="font-medium">Redo (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}
