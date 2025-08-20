"use client"

import React from "react"
import { useSelector, useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Copy, 
  Trash2, 
  Download, 
  Upload, 
  Share2, 
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react"
import { RootState } from "@/lib/redux/store"
import { 
  clearVariationDesign, 
  shareDesignAcrossVariations,
  clearAllDesigns 
} from "@/lib/redux/designToolSlices/designSlice"
import { useToast } from "@/components/ui/use-toast"

interface DesignManagementPanelProps {
  selectedProduct: any
  productColor: string
  viewMode: string
}

export function DesignManagementPanel({ 
  selectedProduct, 
  productColor, 
  viewMode 
}: DesignManagementPanelProps) {
  const dispatch = useDispatch()
  const { variationDesigns } = useSelector((state: RootState) => state.design)
  const { toast } = useToast()
  
  // Get current variation ID
  const getCurrentVariationId = () => {
    if (!selectedProduct?.hasVariations || !selectedProduct?.variations) return null
    
    const variation = selectedProduct.variations.find((v: any) => v.color.hex_code === productColor)
    return variation?.id || null
  }
  
  // Get all variations that have the current view mode
  const getVariationsWithCurrentView = () => {
    if (!selectedProduct?.hasVariations || !selectedProduct?.variations) return []
    
    return selectedProduct.variations
      .filter((v: any) => {
        return v.images?.some((img: any) => img.angle === viewMode && img.url && img.url.trim() !== '')
      })
      .map((v: any) => ({
        id: v.id,
        color: v.color,
        hasDesign: variationDesigns.some(d => d.variationId === v.id && d.viewMode === viewMode),
        availableViews: v.images?.map((img: any) => img.angle).filter(Boolean) || []
      }))
  }
  
  // Get all variations for this product with their view information
  const getAllVariationsWithViews = () => {
    if (!selectedProduct?.hasVariations || !selectedProduct?.variations) return []
    
    return selectedProduct.variations.map((v: any) => ({
      id: v.id,
      color: v.color,
      availableViews: v.images?.map((img: any) => img.angle).filter(Boolean) || [],
      hasCurrentView: v.images?.some((img: any) => img.angle === viewMode && img.url && img.url.trim() !== ''),
      hasDesign: variationDesigns.some(d => d.variationId === v.id && d.viewMode === viewMode)
    }))
  }
  
  // Get design for a specific variation and view
  const getDesignForVariation = (variationId: string, view: string) => {
    return variationDesigns.find(d => d.variationId === variationId && d.viewMode === view)
  }
  
  // Share current design to other variations
  const handleShareDesign = () => {
    if (!currentDesign) {
      toast({
        title: "No Design to Share",
        description: "Please create a design first before sharing it.",
        variant: "destructive"
      })
      return
    }

    // Get variations that don't have a design for the current view
    const variationsWithoutDesign = variationsWithView.filter((variation: any) => {
      const design = getDesignForVariation(variation.id, viewMode)
      return !design
    }).map((variation: any) => variation.id)

    if (variationsWithoutDesign.length === 0) {
      toast({
        title: "No Variations to Share With",
        description: "All variations already have designs for this view.",
        variant: "default"
      })
      return
    }

    // Share the current design to other variations
    dispatch(shareDesignAcrossVariations({
      sourceVariationId: currentVariationId!,
      viewMode,
      canvasJSON: currentDesign.canvasJSON,
      targetVariationIds: variationsWithoutDesign
    }))

    toast({
      title: "Design Shared Successfully",
      description: `Shared design to ${variationsWithoutDesign.length} variation(s).`,
      variant: "default"
    })
  }
  
  // Clear design for a specific variation
  const handleClearDesign = (variationId: string) => {
    dispatch(clearVariationDesign({ variationId, viewMode }))
  }
  
  // Clear all designs for current view
  const handleClearAllDesigns = () => {
    const variationsWithView = getVariationsWithCurrentView()
    variationsWithView.forEach((v: any) => {
      if (v.hasDesign) {
        dispatch(clearVariationDesign({ variationId: v.id, viewMode }))
      }
    })
  }
  
  // Export design as JSON
  const handleExportDesign = (variationId: string) => {
    const design = getDesignForVariation(variationId, viewMode)
    if (!design) return
    
    const dataStr = JSON.stringify(design.canvasJSON, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `design_${variationId}_${viewMode}_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }
  
  // Import design from JSON
  const handleImportDesign = (variationId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const canvasJSON = JSON.parse(e.target?.result as string)
            // Here you would dispatch an action to save the imported design
            console.log('Imported design:', canvasJSON)
          } catch (error) {
            console.error('Error parsing imported design:', error)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }
  
  const currentVariationId = getCurrentVariationId()
  const variationsWithView = getVariationsWithCurrentView()
  const currentDesign = getDesignForVariation(currentVariationId || '', viewMode)
  
  // Get design statistics
  const getDesignStats = () => {
    const totalVariations = variationsWithView.length
    const variationsWithDesigns = variationsWithView.filter((variation: any) => 
      getDesignForVariation(variation.id, viewMode)
    ).length
    const sharedDesigns = variationDesigns.filter((d: any) => 
      d.viewMode === viewMode && d.isShared
    ).length
    const customDesigns = variationDesigns.filter((d: any) => 
      d.viewMode === viewMode && !d.isShared
    ).length
    
    // Get view compatibility info
    const allVariations = getAllVariationsWithViews()
    const variationsWithCurrentView = allVariations.filter((v: any) => v.hasCurrentView).length
    const totalProductVariations = allVariations.length
    
    return { 
      totalVariations, 
      variationsWithDesigns, 
      sharedDesigns, 
      customDesigns,
      variationsWithCurrentView,
      totalProductVariations
    }
  }

  const stats = getDesignStats()

  if (!selectedProduct || !currentVariationId) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Please select a product to manage designs.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Design Management</h3>
        <p className="text-sm text-gray-600">Manage designs across product variations</p>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Design Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Total Variations:</span>
              <span className="font-medium">{stats.totalVariations}</span>
            </div>
            <div className="flex justify-between">
              <span>With Designs:</span>
              <span className="font-medium">{stats.variationsWithDesigns}</span>
            </div>
            <div className="flex justify-between">
              <span>Shared:</span>
              <span className="font-medium text-blue-600">{stats.sharedDesigns}</span>
            </div>
            <div className="flex justify-between">
              <span>Custom:</span>
              <span className="font-medium text-green-600">{stats.customDesigns}</span>
            </div>
            <div className="flex justify-between">
              <span>Variations with Current View:</span>
              <span className="font-medium text-purple-600">{stats.variationsWithCurrentView}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Product Variations:</span>
              <span className="font-medium text-orange-600">{stats.totalProductVariations}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleShareDesign}
          disabled={!currentDesign}
          size="sm"
          className="flex-1"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Current Design
        </Button>
        <Button
          onClick={handleClearAllDesigns}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Variations List */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Variations for {viewMode} view</h4>
        {variationsWithView.map((variation: any) => {
          const variationId = variation.id
          const design = getDesignForVariation(variationId, viewMode)
          const isCurrentVariation = variationId === currentVariationId
          
          return (
            <Card key={variationId} className={isCurrentVariation ? "ring-2 ring-blue-500" : ""}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: variation.color?.hex_code }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {variation.color?.name || 'Unknown Color'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {design ? (design.isShared ? 'Shared Design' : 'Custom Design') : 'No Design'}
                      </p>
                      <p className="text-xs text-blue-600">
                        Views: {variation.availableViews.join(', ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {design && (
                      <>
                        <Button
                          onClick={() => handleExportDesign(variationId)}
                          size="sm"
                          variant="ghost"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleClearDesign(variationId)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => handleImportDesign(variationId)}
                      size="sm"
                      variant="ghost"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* All Variations View Compatibility */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">All Variations & View Compatibility</h4>
        {getAllVariationsWithViews().map((variation: any) => {
          const variationId = variation.id
          const design = getDesignForVariation(variationId, viewMode)
          const isCurrentVariation = variationId === currentVariationId
          const hasCurrentView = variation.hasCurrentView
          
          return (
            <Card key={variationId} className={`${isCurrentVariation ? "ring-2 ring-blue-500" : ""} ${!hasCurrentView ? "opacity-60" : ""}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: variation.color?.hex_code }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {variation.color?.name || 'Unknown Color'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant={hasCurrentView ? "default" : "secondary"} className="text-xs">
                          {hasCurrentView ? `Has ${viewMode} view` : `No ${viewMode} view`}
                        </Badge>
                        {design && (
                          <Badge variant={design.isShared ? "outline" : "default"} className="text-xs">
                            {design.isShared ? 'Shared' : 'Custom'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Available views: {variation.availableViews.join(', ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {!hasCurrentView && (
                      <p className="text-xs text-gray-500 italic">
                        Cannot share {viewMode} designs
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
