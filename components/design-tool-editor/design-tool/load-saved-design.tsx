"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useDispatch } from "react-redux"
import { setSelectedProduct, setProductColor, setViewMode, setSelectedTemplate } from "@/lib/redux/designToolSlices/designSlice"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface LoadSavedDesignProps {
  onDesignLoaded: (canvasJSON: any) => void
}

export function LoadSavedDesign({ onDesignLoaded }: LoadSavedDesignProps) {
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const designId = searchParams.get("designId")
  const productId = searchParams.get("productId")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!designId) return
    
    const loadDesign = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log("Loading design with ID:", designId)
        const response = await fetch(`/api/designs/${designId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to load design: ${response.statusText}`)
        }
        
        const design = await response.json()
        console.log("Design loaded:", design)
        
        // Validate design data
        if (!design.designData) {
          throw new Error("Design data is missing or corrupted")
        }
        
        // Check if we have enhanced design data with complete product reference
        if (design.designData.product) {
          console.log("Loading design with complete product reference")
          
          // Use the saved complete product reference (new format)
          let savedProduct = design.designData.product
          const savedState = design.designData.selectedState
          
          console.log("Saved product:", savedProduct)
          console.log("Saved state:", savedState)

          // Ensure categoryId exists; if missing, fetch product by id and merge
          if (!savedProduct?.categoryId && savedProduct?.id) {
            try {
              console.log("🔥 [LoadSavedDesign] categoryId missing on saved product, fetching by id", savedProduct.id)
              const productRes = await fetch(`/api/products/${savedProduct.id}`)
              if (productRes.ok) {
                const fullProduct = await productRes.json()
                savedProduct = { ...savedProduct, categoryId: fullProduct?.categoryId }
                console.log("🔥 [LoadSavedDesign] merged categoryId into savedProduct", { categoryId: savedProduct.categoryId })
              }
            } catch (e) {
              console.warn("🔥 [LoadSavedDesign] failed to fetch product for categoryId repair", e)
            }
          }
          
          // Restore the complete product
          dispatch(setSelectedProduct(savedProduct))
          
          // Restore the selected state
          if (savedState) {
            if (savedState.productColor) {
              console.log("Restoring product color:", savedState.productColor)
              dispatch(setProductColor(savedState.productColor))
            }
            
            if (savedState.viewMode) {
              console.log("Restoring view mode:", savedState.viewMode)
              dispatch(setViewMode(savedState.viewMode))
            }
            
            if (savedState.selectedTemplate) {
              console.log("Restoring selected template:", savedState.selectedTemplate)
              dispatch(setSelectedTemplate(savedState.selectedTemplate))
            }
          }
          
          // Load canvas data after product state is restored
          if (design.designData.canvasJSON) {
            console.log("Preparing to load canvas JSON with restored product state...")
            
            setTimeout(() => {
              console.log("Loading canvas JSON:", design.designData.canvasJSON)
              onDesignLoaded(design.designData.canvasJSON)
            }, 800)
          } else {
            console.warn("No canvas JSON data found in design")
          }
          
        } else {
          // Legacy design format - fetch product by ID
          console.log("Loading legacy design format, fetching product by ID")
          
          const productId = design.designData.productId
          if (productId) {
            console.log("Fetching product:", productId)
            const productResponse = await fetch(`/api/products/${productId}`)
            if (productResponse.ok) {
              const product = await productResponse.json()
              console.log("Product loaded:", product)
              
              // Dispatch product selection
              dispatch(setSelectedProduct(product))
              
              // Set product color if available (legacy format)
              if (design.designData.productColor) {
                console.log("Setting product color:", design.designData.productColor)
                dispatch(setProductColor(design.designData.productColor))
              }
              
              // Set view mode if available (legacy format)
              if (design.designData.viewMode) {
                console.log("Setting view mode:", design.designData.viewMode)
                dispatch(setViewMode(design.designData.viewMode))
              }
              
              // Load canvas data after product is set
              if (design.designData.canvasJSON) {
                console.log("Preparing to load canvas JSON...")
                
                setTimeout(() => {
                  console.log("Loading canvas JSON:", design.designData.canvasJSON)
                  onDesignLoaded(design.designData.canvasJSON)
                }, 800)
              } else {
                console.warn("No canvas JSON data found in design")
              }
            } else {
              throw new Error(`Failed to load product: ${productResponse.statusText}`)
            }
          } else {
            console.warn("No product ID found in design data")
          }
        }
      } catch (error) {
        console.error("Error loading design:", error)
        setError(error instanceof Error ? error.message : "Failed to load design")
      } finally {
        setLoading(false)
      }
    }
    
    loadDesign()
  }, [designId, dispatch, onDesignLoaded])

  // preselect the product in the design tool so the user can start designing immediately.
  useEffect(() => {
    if (!productId || designId) return
    const loadProductOnly = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/products/${productId}`)
        if (!res.ok) throw new Error("Failed to load product")
        const product = await res.json()
        dispatch(setSelectedProduct(product))
        // If product has variations with colors, pick the first as default color
        const firstHex = product?.variations?.[0]?.color?.hex_code || product?.baseColor
        if (firstHex) dispatch(setProductColor(firstHex))
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load product")
      } finally {
        setLoading(false)
      }
    }
    loadProductOnly()
  }, [productId, designId, dispatch])
  
  if (!designId) return null
  
  if (loading) {
    return (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="space-y-4 max-w-md w-full p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-40 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return null
}