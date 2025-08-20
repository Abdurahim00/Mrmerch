"use client"
import { useSelector, useDispatch } from "react-redux"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { setSelectedCategory, setSearchTerm } from "@/lib/redux/designToolSlices/templatesSlice"
import { useFabricCanvas } from "@/hooks/useFabricCanvas"
import { RootState, AppDispatch } from "@/lib/redux/store"
import { useEffect } from "react"
import { fetchTemplates } from "@/lib/redux/slices/templatesSlice"
import { toast } from "sonner"
import { setSelectedTemplate } from "@/lib/redux/designToolSlices/designSlice"

interface Template {
  id: string
  name: string
  category: string
  image: string
  price: number | "free"
}

interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
  loading?: boolean
}

export function TemplateModal({ isOpen, onClose, loading = false }: TemplateModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { selectedCategory, searchTerm, categories } = useSelector((state: RootState) => state.templates)
  const { items: templates, loading: templatesLoading } = useSelector((state: RootState) => state.templatesManagement)
  const { fabricCanvas } = useSelector((state: RootState) => state.canvas)
  
  console.log('🛠️ [TemplateModal] Render state:', { isOpen, templatesCount: templates?.length, templatesLoading, loading })

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchTemplates())
    }
  }, [isOpen, dispatch])

  const { addImage } = useFabricCanvas("design-canvas")

  const handleSelectTemplate = (template: Template) => {
    if (fabricCanvas) {
      // Add the template directly to the Fabric canvas
      addImage(fabricCanvas, template.image, {
        isTemplate: true, // Flag that it's a template, not an uploaded image
      })
      
      // Also update the Redux state
      dispatch(setSelectedTemplate(template))
      onClose()
    } else {
      toast.warning("Canvas is not ready yet. Please wait a moment and try again.")
    }
  }

  const filteredTemplates = templates.filter((template: Template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Template</DialogTitle>
        </DialogHeader>

       

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              className="pl-10 rounded-xl"
              value={searchTerm}
              onChange={(e) => dispatch(setSearchTerm(e.target.value))}
            />
          </div>

          {/* <div className="flex flex-wrap gap-2">
            {categories.map((category: string) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => dispatch(setSelectedCategory(category))}
              >
                {category}
              </Button>
            ))}
          </div> */}

          {templatesLoading || loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border rounded-xl p-3">
                  <Skeleton className="aspect-square w-full mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-1/3 mb-3" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No templates found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTemplates.map((template: Template) => (
                <div
                  key={template.id}
                  className="border rounded-xl p-3 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center group-hover:bg-gray-200 transition-colors overflow-hidden">
                    <img
                      src={template.image || "/placeholder.svg"}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h3 className="font-medium text-sm text-gray-900 mb-1 truncate">{template.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{template.category}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">
                      {template.price === "free" ? "Free" : `$${Number(template.price).toFixed(2)}`}
                    </span>
                  </div>

                  <Button size="sm" className="w-full rounded-lg text-xs" onClick={() => handleSelectTemplate(template)} disabled={!fabricCanvas}>
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
