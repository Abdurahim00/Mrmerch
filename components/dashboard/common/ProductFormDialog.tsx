import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { FileUpload } from "@/components/ui/file-upload"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Product, Variation, Color, VariationImage } from "@/types"
import { ProductAnglesSelector } from "./ProductAnglesSelector"
import { useState } from "react"
import { useAppSelector } from "@/lib/redux/hooks"
import { Badge } from "@/components/ui/badge"

// Extend Window interface for color picker
declare global {
  interface Window {
    updateVariationFromColorPicker?: (variationIndex: number, hexValue: string, colorName: string | null) => void
  }
}

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: any
  onSubmit: (values: any, helpers: any) => Promise<void>
  t: any
  productCategories: any[]
  isSubmitting: boolean
  isEdit?: boolean
}

const defaultAngles = ["front", "back", "left", "right", "material"]

// Color name mapping for common hex values
const colorNameMap: Record<string, string> = {
  "#000000": "Black",
  "#FFFFFF": "White",
  "#FF0000": "Red",
  "#00FF00": "Green",
  "#0000FF": "Blue",
  "#FFFF00": "Yellow",
  "#FF00FF": "Magenta",
  "#00FFFF": "Cyan",
  "#FFA500": "Orange",
  "#800080": "Purple",
  "#A52A2A": "Brown",
  "#808080": "Gray",
  "#FFC0CB": "Pink",
  "#FFD700": "Gold",
  "#C0C0C0": "Silver",
  "#8B4513": "Saddle Brown",
  "#32CD32": "Lime Green",
  "#FF4500": "Orange Red",
  "#4169E1": "Royal Blue",
  "#DC143C": "Crimson",
  "#2b4e58": "Dark Teal",
}

// Function to get color name from hex value
const getColorNameFromHex = (hex: string): string | null => {
  const normalizedHex = hex.toUpperCase()
  return colorNameMap[normalizedHex] || null
}

// Function to start web page color picker
const startWebPageColorPicker = (variationIndex: number) => {
  // Create a temporary color picker that can be used to pick colors from the page
  const colorPicker = document.createElement('input')
  colorPicker.type = 'color'
  colorPicker.style.position = 'fixed'
  colorPicker.style.top = '50%'
  colorPicker.style.left = '50%'
  colorPicker.style.transform = 'translate(-50%, -50%)'
  colorPicker.style.zIndex = '10000'
  colorPicker.style.opacity = '0'
  colorPicker.style.pointerEvents = 'none'
  
  document.body.appendChild(colorPicker)
  
  // Trigger color picker
  colorPicker.click()
  
  // Handle color selection
  colorPicker.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement
    const hexValue = target.value
    const colorName = getColorNameFromHex(hexValue)
    
    // Update the variation with the picked color
    if (window.updateVariationFromColorPicker) {
      window.updateVariationFromColorPicker(variationIndex, hexValue, colorName)
    }
    
    // Clean up
    document.body.removeChild(colorPicker)
  })
  
  // Clean up if user cancels
  setTimeout(() => {
    if (document.body.contains(colorPicker)) {
      document.body.removeChild(colorPicker)
    }
  }, 1000)
}

const productSchema = Yup.object().shape({
  name: Yup.string().required("productNameRequired").min(2, "nameMinLength"),
  price: Yup.number().required("priceRequired").min(0.01, "priceGreaterThanZero"),
  categoryId: Yup.string().required("categoryRequired"),
  description: Yup.string(),
  image: Yup.string(),
  hasVariations: Yup.boolean(),
  variations: Yup.array().of(
    Yup.object().shape({
      id: Yup.string(),
      color: Yup.object().shape({
        name: Yup.string(),
        hex_code: Yup.string(),
        swatch_image: Yup.string().nullable(),
      }),
      price: Yup.number(),
      inStock: Yup.boolean(),
      stockQuantity: Yup.number(),
      images: Yup.array().of(
        Yup.object().shape({
          id: Yup.string(),
          url: Yup.string().nullable(), // Make url optional to allow adding images without blocking
          alt_text: Yup.string().nullable(), // Make alt_text optional
          angle: Yup.string(),
          is_primary: Yup.boolean(),
        })
      ),
    })
  ),
})

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  t,
  productCategories,
  isSubmitting,
  isEdit = false,
}) => {
  console.log('🚀 [ProductFormDialog] Component initialized with:', {
    initialValues,
    hasVariations: initialValues.hasVariations,
    hasIndividualImages: {
      frontImage: !!initialValues.frontImage,
      backImage: !!initialValues.backImage,
      leftImage: !!initialValues.leftImage,
      rightImage: !!initialValues.rightImage,
      materialImage: !!initialValues.materialImage
    },
    hasSingleProductFields: {
      baseColor: !!initialValues.baseColor,
      stockQuantity: initialValues.stockQuantity !== undefined
    }
  })
  
  const [showVariations, setShowVariations] = useState(initialValues.hasVariations || false)
  const [expandedVariations, setExpandedVariations] = useState<Set<string>>(new Set())
  
  // Ensure showVariations state is updated when initialValues change (for edit mode)
  React.useEffect(() => {
    if (initialValues.hasVariations !== undefined) {
      console.log('🔄 [ProductFormDialog] Updating showVariations from initialValues:', {
        from: showVariations,
        to: initialValues.hasVariations,
        initialValues: initialValues.hasVariations
      })
      setShowVariations(initialValues.hasVariations)
      
      // Auto-expand first variation if it exists
      if (initialValues.hasVariations && initialValues.variations && initialValues.variations.length > 0) {
        setExpandedVariations(new Set([initialValues.variations[0].id]))
      }
    }
  }, [initialValues.hasVariations])
  
  const { categories, subcategories } = useAppSelector((s: any) => s.categories)
  
  const formik = useFormik({
    initialValues: {
      ...initialValues,
      hasVariations: initialValues.hasVariations || false,
      variations: initialValues.variations || [],
      eligibleForCoupons: initialValues.eligibleForCoupons ?? false,
      purchaseLimit: initialValues.purchaseLimit || {
        enabled: false,
        maxQuantityPerOrder: 5,
        message: ""
      },
      // Add single product fields
      baseColor: initialValues.baseColor || "",
      colorHex: initialValues.colorHex || "#000000",
      stockQuantity: initialValues.stockQuantity || 0,
      // Add angle image fields for products without variations
      frontImage: initialValues.frontImage || "",
      backImage: initialValues.backImage || "",
      leftImage: initialValues.leftImage || "",
      rightImage: initialValues.rightImage || "",
      materialImage: initialValues.materialImage || "",
      frontAltText: initialValues.frontAltText || "",
      backAltText: initialValues.backAltText || "",
      leftAltText: initialValues.leftAltText || "",
      rightAltText: initialValues.rightAltText || "",
      materialAltText: initialValues.materialAltText || "",
    },
    enableReinitialize: true,
    validationSchema: productSchema,
    onSubmit: async (values, helpers) => {
              console.log("🚀 [ProductFormDialog] Form submission started with values:", {
          hasVariations: values.hasVariations,
          variationsCount: values.variations?.length,
          individualImages: {
            frontImage: values.frontImage,
            backImage: values.backImage,
            leftImage: values.leftImage,
            rightImage: values.rightImage,
            materialImage: values.materialImage
          },
          singleProductFields: {
            baseColor: values.baseColor,
            stockQuantity: values.stockQuantity,
            colorHex: values.colorHex
          }
        })
        try {
        // Clean up variations before submission - remove images without URLs
        const cleanedValues = {
          ...values,
          variations: values.variations?.map((variation: any) => ({
            ...variation,
            images: variation.images?.filter((img: any) => img.url && img.url.trim() !== '') || []
          })) || []
        }
        
        // For products without variations, create angles array from individual angle images
        if (!cleanedValues.hasVariations) {
          console.log('🎯 [ProductFormDialog] Processing single product without variations')
          
          const angles: string[] = []
          if (cleanedValues.frontImage) angles.push('front')
          if (cleanedValues.backImage) angles.push('back')
          if (cleanedValues.leftImage) angles.push('left')
          if (cleanedValues.rightImage) angles.push('right')
          if (cleanedValues.materialImage) angles.push('material')
          cleanedValues.angles = angles
          
          // Ensure all individual angle image fields are properly included
          // This is crucial for single products to work correctly
          const requiredFields = [
            'frontImage', 'backImage', 'leftImage', 'rightImage', 'materialImage',
            'frontAltText', 'backAltText', 'leftAltText', 'rightAltText', 'materialAltText'
          ]
          
          requiredFields.forEach(field => {
            if (cleanedValues[field] === undefined) {
              cleanedValues[field] = ''
            }
          })
          
          console.log('🔧 [ProductFormDialog] Single product angles created:', {
            angles,
            frontImage: cleanedValues.frontImage,
            backImage: cleanedValues.backImage,
            leftImage: cleanedValues.leftImage,
            rightImage: cleanedValues.rightImage,
            materialImage: cleanedValues.materialImage,
            baseColor: cleanedValues.baseColor,
            stockQuantity: cleanedValues.stockQuantity
          })
          
          // Debug: Log the complete cleaned values before submission
          console.log('🔧 [ProductFormDialog] Complete cleaned values before submission:', {
            hasVariations: cleanedValues.hasVariations,
            angles: cleanedValues.angles,
            individualImages: {
              frontImage: cleanedValues.frontImage,
              backImage: cleanedValues.backImage,
              leftImage: cleanedValues.leftImage,
              rightImage: cleanedValues.rightImage,
              materialImage: cleanedValues.materialImage
            },
            singleProductFields: {
              baseColor: cleanedValues.baseColor,
              stockQuantity: cleanedValues.stockQuantity,
              colorHex: cleanedValues.colorHex
            },
            allKeys: Object.keys(cleanedValues)
          })
        } else {
          console.log('🔄 [ProductFormDialog] Processing product with variations:', {
            variationsCount: cleanedValues.variations?.length,
            variations: cleanedValues.variations?.map((v: any, idx: number) => ({
              index: idx,
              colorName: v.color?.name,
              colorHex: v.color?.hex_code,
              imagesCount: v.images?.length,
              images: v.images?.map((img: any) => ({
                angle: img.angle,
                url: img.url,
                isPrimary: img.is_primary
              }))
            }))
          })
        }
        
        console.log("✅ [ProductFormDialog] Final cleaned values before submission:", {
          hasVariations: cleanedValues.hasVariations,
          angles: cleanedValues.angles,
          variationsCount: cleanedValues.variations?.length,
          individualImages: {
            frontImage: cleanedValues.frontImage,
            backImage: cleanedValues.backImage,
            leftImage: cleanedValues.leftImage,
            rightImage: cleanedValues.rightImage,
            materialImage: cleanedValues.materialImage
          },
          singleProductFields: {
            baseColor: cleanedValues.baseColor,
            stockQuantity: cleanedValues.stockQuantity,
            colorHex: cleanedValues.colorHex
          }
        })
        await onSubmit(cleanedValues, helpers)
      } catch (error) {
        console.error("❌ [ProductFormDialog] Form submission error:", error)
        helpers.setSubmitting(false)
      }
    },
  })
  
  // Add global color picker function to window
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.updateVariationFromColorPicker = (variationIndex: number, hexValue: string, colorName: string | null) => {
        // This will be called from the color picker
        const currentVariations = formik.values.variations
        if (currentVariations[variationIndex]) {
          const updatedVariation = {
            ...currentVariations[variationIndex],
            color: {
              ...currentVariations[variationIndex].color,
              hex_code: hexValue,
              name: colorName || currentVariations[variationIndex].color.name
            }
          }
          
          const newVariations = [...currentVariations]
          newVariations[variationIndex] = updatedVariation
          formik.setFieldValue('variations', newVariations)
        }
      }
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.updateVariationFromColorPicker
      }
    }
  }, [formik])

  // Log when showVariations state changes
  React.useEffect(() => {
    console.log('🔄 [ProductFormDialog] showVariations state changed:', {
      showVariations,
      formikValues: {
        hasVariations: formik.values.hasVariations,
        variationsCount: formik.values.variations?.length,
        individualImages: {
          frontImage: formik.values.frontImage,
          backImage: formik.values.backImage,
          leftImage: formik.values.leftImage,
          rightImage: formik.values.rightImage,
          materialImage: formik.values.materialImage
        }
      }
    })
  }, [showVariations, formik.values])

  // Helper to add a new variation
  const addVariation = () => {
    console.log('➕ [ProductFormDialog] Adding new variation')
    
    const newVariation: Variation = {
      id: `var_${Date.now()}`,
      color: { name: "", hex_code: "#000000", swatch_image: "" },
      price: formik.values.price || 0, // Use base product price or default to 0
      inStock: true,
      stockQuantity: 0,
      images: [],
    }
    
    console.log('➕ [ProductFormDialog] New variation created:', newVariation)
    
    // Create a proper copy of the existing variations and add the new one
    const updatedVariations = [...formik.values.variations, newVariation]
    formik.setFieldValue("variations", updatedVariations)
    
    console.log('➕ [ProductFormDialog] Variations updated:', updatedVariations)
  }

  // Helper to remove a variation
  const removeVariation = (id: string) => {
    console.log(`🗑️ [ProductFormDialog] Removing variation:`, id)
    
    // Create a proper copy and filter out the variation to remove
    const updatedVariations = formik.values.variations.filter((v: Variation) => v.id !== id)
    
    // Update the form state
    formik.setFieldValue("variations", updatedVariations)
    
    // Also remove from expanded variations if it was expanded
    setExpandedVariations(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    
    console.log(`🗑️ [ProductFormDialog] Variation removed, updated variations:`, updatedVariations)
  }

  // Utility function to create a deep copy of variations array
  const createVariationsCopy = () => {
    try {
      // Ensure variations is an array and create a deep copy
      if (!Array.isArray(formik.values.variations)) {
        console.warn('⚠️ [ProductFormDialog] Variations is not an array, creating empty array')
        return []
      }
      
      return formik.values.variations.map((variation: any) => ({
        ...variation,
        images: Array.isArray(variation.images) ? [...variation.images] : []
      }))
    } catch (error) {
      console.error('❌ [ProductFormDialog] Error creating variations copy:', error)
      return []
    }
  }

  // Helper to update a variation
  const updateVariation = (index: number, updated: Partial<Variation>) => {
    console.log(`🔄 [ProductFormDialog] Updating variation ${index}:`, updated)
    
    // Use utility function to create deep copy
    const variations = createVariationsCopy()
    
    // Update the specific variation
    variations[index] = { ...variations[index], ...updated }
    
    // Update the form state
    formik.setFieldValue("variations", variations)
    console.log(`🔄 [ProductFormDialog] Variation updated, variations:`, variations)
  }

  // Helper to update a variation image
  const updateVariationImage = (varIdx: number, imgIdx: number, updated: Partial<VariationImage>) => {
    console.log(`🖼️ [ProductFormDialog] Updating image ${imgIdx} in variation ${varIdx}:`, updated)
    
    // Use utility function to create deep copy
    const variations = createVariationsCopy()
    
    // Create a copy of the images array and update the specific image
    const images = [...variations[varIdx].images]
    images[imgIdx] = { ...images[imgIdx], ...updated }
    variations[varIdx].images = images
    
    // Update the form state
    formik.setFieldValue("variations", variations)
    console.log(`🖼️ [ProductFormDialog] Image updated, variations:`, variations)
  }

  // Helper to add an image to a variation
  const addVariationImage = (varIdx: number, angle: string) => {
    console.log(`🖼️ [ProductFormDialog] Adding ${angle} image to variation ${varIdx}`)
    
    // Validate variation index
    if (varIdx < 0 || varIdx >= formik.values.variations.length) {
      console.error(`❌ [ProductFormDialog] Invalid variation index: ${varIdx}`)
      return
    }
    
    // Use utility function to create deep copy
    const variations = createVariationsCopy()
    
    // Ensure the variation exists and has an images array
    if (!variations[varIdx]) {
      console.error(`❌ [ProductFormDialog] Variation at index ${varIdx} not found`)
      return
    }
    
    if (!Array.isArray(variations[varIdx].images)) {
      variations[varIdx].images = []
    }
    
    const newImage: VariationImage = {
      id: `img_${Date.now()}`,
      url: "",
      alt_text: "",
      angle,
      is_primary: variations[varIdx].images.length === 0,
    }
    
    console.log('🖼️ [ProductFormDialog] New image created:', newImage)
    
    // Add the new image to the copied array
    variations[varIdx].images.push(newImage)
    
    // Update the form state with the new array
    formik.setFieldValue("variations", variations)
    console.log(`🖼️ [ProductFormDialog] Updated variations:`, variations)
  }

  // Helper to remove an image from a variation
  const removeVariationImage = (varIdx: number, imgId: string) => {
    console.log(`🗑️ [ProductFormDialog] Removing image ${imgId} from variation ${varIdx}`)
    
    // Use utility function to create deep copy
    const variations = createVariationsCopy()
    
    // Filter out the image to remove
    variations[varIdx].images = variations[varIdx].images.filter((img: VariationImage) => img.id !== imgId)
    
    // Update the form state
    formik.setFieldValue("variations", variations)
    console.log(`🗑️ [ProductFormDialog] Image removed, updated variations:`, variations)
  }

  // Helper to toggle variation expansion
  const toggleVariationExpansion = (variationId: string) => {
    console.log(`📂 [ProductFormDialog] Toggling variation expansion:`, variationId)
    setExpandedVariations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(variationId)) {
        newSet.delete(variationId)
        console.log(`📂 [ProductFormDialog] Collapsed variation:`, variationId)
      } else {
        newSet.add(variationId)
        console.log(`📂 [ProductFormDialog] Expanded variation:`, variationId)
      }
      return newSet
    })
  }

  // Helper to expand all variations
  const expandAllVariations = () => {
    console.log('📂 [ProductFormDialog] Expanding all variations')
    const allVariationIds = formik.values.variations.map((v: Variation) => v.id)
    setExpandedVariations(new Set(allVariationIds))
  }

  // Helper to collapse all variations
  const collapseAllVariations = () => {
    console.log('📂 [ProductFormDialog] Collapsing all variations')
    setExpandedVariations(new Set())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {isEdit ? t.editProduct : t.addProduct}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-6 pt-4">
          {/* Basic product fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t.productName} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder={t.enterProductName}
                className={
                  formik.touched.name && formik.errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-slate-300 focus:border-sky-500 focus:ring-sky-200"
                }
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-sm text-red-600">{t[formik.errors.name as keyof typeof t] || formik.errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t.priceSEK} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formik.values.price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="0.00"
                className={
                  formik.touched.price && formik.errors.price
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-slate-300 focus:border-sky-500 focus:ring-sky-200"
                }
              />
              {formik.touched.price && formik.errors.price && (
                <p className="text-sm text-red-600">{t[formik.errors.price as keyof typeof t] || formik.errors.price}</p>
              )}
            </div>
          </div>
          {/* Coupon eligibility */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="eligibleForCoupons"
              checked={!!formik.values.eligibleForCoupons}
              onChange={(e) => formik.setFieldValue("eligibleForCoupons", e.target.checked)}
            />
            <Label htmlFor="eligibleForCoupons">Eligible for site-wide coupons</Label>
          </div>
          
          {/* Purchase Limits Section */}
          <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="purchaseLimitEnabled"
                checked={!!formik.values.purchaseLimit?.enabled}
                onChange={(e) => {
                  const currentLimit = formik.values.purchaseLimit || {}
                  formik.setFieldValue("purchaseLimit", {
                    ...currentLimit,
                    enabled: e.target.checked
                  })
                }}
              />
              <Label htmlFor="purchaseLimitEnabled" className="font-medium">Enable Purchase Limits</Label>
            </div>
            
            {formik.values.purchaseLimit?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxQuantityPerOrder" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Max Quantity Per Order
                  </Label>
                  <Input
                    id="maxQuantityPerOrder"
                    type="number"
                    min="1"
                    value={formik.values.purchaseLimit?.maxQuantityPerOrder || 5}
                    onChange={(e) => {
                      const currentLimit = formik.values.purchaseLimit || {}
                      formik.setFieldValue("purchaseLimit", {
                        ...currentLimit,
                        maxQuantityPerOrder: Number(e.target.value)
                      })
                    }}
                    placeholder="5"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="purchaseLimitMessage" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Custom Limit Message (Optional)
                  </Label>
                  <Input
                    id="purchaseLimitMessage"
                    value={formik.values.purchaseLimit?.message || ""}
                    onChange={(e) => {
                      const currentLimit = formik.values.purchaseLimit || {}
                      formik.setFieldValue("purchaseLimit", {
                        ...currentLimit,
                        message: e.target.value
                      })
                    }}
                    placeholder="Maximum quantity limit exceeded. Please reduce your order."
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="categoryId" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.category} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formik.values.categoryId}
              onValueChange={(value) => formik.setFieldValue("categoryId", value)}
            >
              <SelectTrigger
                className={
                  formik.touched.categoryId && formik.errors.categoryId
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-slate-300 focus:border-sky-500 focus:ring-sky-200"
                }
              >
                <SelectValue placeholder={t.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.categoryId && formik.errors.categoryId && (
              <p className="text-sm text-red-600">{t[formik.errors.categoryId as keyof typeof t] || formik.errors.categoryId}</p>
            )}
          </div>

          {/* Subcategories checkboxes */}
          {formik.values.categoryId && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subcategories</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {subcategories
                  .filter((s: any) => s.categoryId === formik.values.categoryId)
                  .map((s: any) => {
                    const checked = (formik.values.subcategoryIds || []).includes(s.id)
                    return (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const list = new Set<string>(formik.values.subcategoryIds || [])
                            if (e.target.checked) list.add(s.id)
                            else list.delete(s.id)
                            formik.setFieldValue("subcategoryIds", Array.from(list))
                          }}
                        />
                        {s.name}
                      </label>
                    )
                  })}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.description}
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder={t.enterProductDescription}
              rows={3}
              className="border-slate-300 focus:border-sky-500 focus:ring-sky-200"
            />
          </div>
          <FileUpload
            label={t.productImage}
            value={formik.values.image}
            onChange={(value) => formik.setFieldValue("image", value)}
            error={formik.touched.image && formik.errors.image ? String(formik.errors.image) : undefined}
          />
          
          {/* Single Product Fields - Color, Stock, and Angle Views */}
          {!showVariations && (
            <div className="space-y-6 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">🎨 Single Product Configuration</h4>
              
              </div>
              
              {/* Color and Stock Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseColor" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    🎨 Base Color
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="baseColor"
                      name="baseColor"
                      value={formik.values.baseColor || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., Black, White, Red"
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={formik.values.colorHex || "#000000"}
                      onChange={(e) => {
                        const hexValue = e.target.value
                        formik.setFieldValue("colorHex", hexValue)
                        // Auto-fill color name if empty
                        if (!formik.values.baseColor) {
                          const colorName = getColorNameFromHex(hexValue)
                          if (colorName) {
                            formik.setFieldValue("baseColor", colorName)
                          }
                        }
                      }}
                      className="h-10 w-12 rounded border border-slate-300 cursor-pointer"
                      title="Pick base color"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="stockQuantity" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    📦 Stock Quantity
                  </Label>
                  <Input
                    id="stockQuantity"
                    name="stockQuantity"
                    type="number"
                    value={formik.values.stockQuantity || 0}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Available stock quantity"
                    className="mt-1"
                  />
                </div>
              </div>
              
              {/* Angle Views Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium text-slate-900 dark:text-slate-100">Product Angle Views</h5>
                  <span className="text-sm text-slate-600">Upload images for different product angles</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {defaultAngles.map((angle) => (
                    <div key={angle} className="border rounded-md p-3 bg-white dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium capitalize">{angle} View</Label>
                        {angle === 'front' && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      <FileUpload
                        value={formik.values[`${angle}Image`] || ""}
                        onChange={(value) => {
                          console.log(`🎯 [ProductFormDialog] Setting ${angle} image:`, value)
                          formik.setFieldValue(`${angle}Image`, value)
                        }}
                        label={`${angle} Image`}
                      />
                      <Input
                        value={formik.values[`${angle}AltText`] || ""}
                        onChange={(e) => formik.setFieldValue(`${angle}AltText`, e.target.value)}
                        placeholder={`Alt text for ${angle} view`}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasVariations"
              checked={showVariations}
              onChange={() => {
                const newValue = !showVariations
                console.log(`🔄 [ProductFormDialog] Toggling variations checkbox:`, {
                  from: showVariations,
                  to: newValue,
                  currentValues: {
                    hasVariations: formik.values.hasVariations,
                    variationsCount: formik.values.variations?.length,
                    individualImages: {
                      frontImage: formik.values.frontImage,
                      backImage: formik.values.backImage,
                      leftImage: formik.values.leftImage,
                      rightImage: formik.values.rightImage,
                      materialImage: formik.values.materialImage
                    }
                  }
                })
                setShowVariations(newValue)
                formik.setFieldValue("hasVariations", newValue)
              }}
            />
            <Label htmlFor="hasVariations">{t.hasVariations || "Has Variations (e.g. color, size)"}</Label>
          </div>
          {showVariations && (
            <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">{t.variations || "Product Variations"}</h4>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={expandAllVariations}
                      className="text-xs"
                    >
                      📂 Expand All
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={collapseAllVariations}
                      className="text-xs"
                    >
                      📁 Collapse All
                    </Button>
                  </div>
                </div>
                <Button type="button" onClick={addVariation} size="sm">{t.addVariation || "Add Variation"}</Button>
              </div>
              
            
              {formik.values.variations.map((variation: Variation, varIdx: number) => (
                <div key={variation.id} className="border rounded-md bg-white dark:bg-slate-900/50 mb-2 overflow-hidden">
                  {/* Variation Header - Always Visible */}
                  <div 
                    className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => toggleVariationExpansion(variation.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg transition-transform duration-200" style={{
                        transform: expandedVariations.has(variation.id) ? 'rotate(90deg)' : 'rotate(0deg)'
                      }}>
                        ▶️
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.variation} #{varIdx + 1}</span>
                        {variation.color.name && (
                          <Badge variant="secondary" className="text-xs">
                            {variation.color.name}
                          </Badge>
                        )}
                        {variation.color.hex_code && (
                          <div 
                            className="w-4 h-4 rounded border border-slate-300"
                            style={{ backgroundColor: variation.color.hex_code }}
                            title={variation.color.hex_code}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        Price: Kr {variation.price || formik.values.price || 0}
                      </span>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation()
                          removeVariation(variation.id)
                        }}
                      >
                        {t.remove || "Remove"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Variation Content - Collapsible */}
                  {expandedVariations.has(variation.id) && (
                    <div className="p-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t.colorName || "Color Name"}</Label>
                      <Input
                        value={variation.color.name}
                        onChange={e => updateVariation(varIdx, { color: { ...variation.color, name: e.target.value } })}
                        placeholder={t.colorName || "Color Name"}
                      />
                    </div>
                    <div>
                      <Label>{t.colorHex || "Color Hex"}</Label>
                      <div className="flex gap-2">
                        <Input
                          value={variation.color.hex_code || "#000000"}
                          onChange={e => {
                            const hexValue = e.target.value
                            updateVariation(varIdx, { color: { ...variation.color, hex_code: hexValue } })
                            
                            // Auto-fill color name based on hex value
                            if (hexValue && hexValue.length === 7) {
                              const colorName = getColorNameFromHex(hexValue)
                              if (colorName) {
                                updateVariation(varIdx, { color: { ...variation.color, hex_code: hexValue, name: colorName } })
                              }
                            }
                          }}
                          placeholder="#000000"
                          className="flex-1"
                        />
                        <input
                          type="color"
                          value={variation.color.hex_code || "#000000"}
                          onChange={e => {
                            const hexValue = e.target.value
                            updateVariation(varIdx, { color: { ...variation.color, hex_code: hexValue } })
                            
                            // Auto-fill color name based on hex value
                            const colorName = getColorNameFromHex(hexValue)
                            if (colorName) {
                              updateVariation(varIdx, { color: { ...variation.color, hex_code: hexValue, name: colorName } })
                            }
                          }}
                          className="h-10 w-12 rounded border border-slate-300 cursor-pointer"
                          title="Pick color"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startWebPageColorPicker(varIdx)}
                          className="px-3"
                          title="Pick color from web page"
                        >
                          🎨
                        </Button>
                      </div>
                    </div>
                    <div>
                     
                      <FileUpload
                        value={variation.color.swatch_image || ""}
                        onChange={(img: string) => updateVariation(varIdx, { color: { ...variation.color, swatch_image: img } })}
                        label={t.swatchImage || "Swatch Image"}
                      />
                    </div>
                    <div>
                      <Label>{t.variationPrice || "Variation Price"}</Label>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          value={variation.price}
                          onChange={e => updateVariation(varIdx, { price: Number(e.target.value) })}
                          placeholder={t.variationPrice || "Variation Price"}
                        />
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span>Base price: Kr {formik.values.price || 0}</span>
                          {variation.price !== formik.values.price && (
                            <Badge variant="outline" className="text-xs">
                              Custom price set
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>{t.stockQuantity || "Stock Quantity"}</Label>
                      <Input
                        type="number"
                        value={variation.stockQuantity}
                        onChange={e => updateVariation(varIdx, { stockQuantity: Number(e.target.value) })}
                        placeholder={t.stockQuantity || "Stock Quantity"}
                      />
                    </div>
                    <div>
                      <Label>{t.inStock || "In Stock"}</Label>
                      <input
                        type="checkbox"
                        checked={variation.inStock}
                        onChange={e => updateVariation(varIdx, { inStock: e.target.checked })}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-slate-900 dark:text-slate-100">📸 Variation Images</h5>
                      <div className="flex gap-2">
                        
                        {defaultAngles.map((angle) => (
                          <Button
                            key={angle}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log(`🎯 [ProductFormDialog] Adding ${angle} image for variation ${varIdx}`)
                              addVariationImage(varIdx, angle)
                            }}
                            className="text-xs px-2 py-1"
                            disabled={variation.images.some(img => img.angle === angle)}
                          >
                            {angle}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Current Images Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                      {variation.images.map((img, imgIdx) => (
                        <div key={img.id} className="border rounded-md p-3 bg-slate-50 dark:bg-slate-800/30 relative">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs capitalize">{img.angle}</Badge>
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => {
                                console.log(`🗑️ [ProductFormDialog] Removing ${img.angle} image from variation ${varIdx}`)
                                removeVariationImage(varIdx, img.id)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </div>
                          
                          <FileUpload
                            value={img.url}
                            onChange={(url) => {
                              console.log(`🖼️ [ProductFormDialog] Updating ${img.angle} image URL for variation ${varIdx}:`, url)
                              updateVariationImage(varIdx, imgIdx, { url })
                            }}
                            label={`${img.angle} Image`}
                          />
                          
                          <Input
                            value={img.alt_text}
                            onChange={(e) => updateVariationImage(varIdx, imgIdx, { alt_text: e.target.value })}
                            placeholder={`Alt text for ${img.angle} view`}
                            className="mt-2"
                          />
                          
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="radio"
                              id={`primary_${varIdx}_${imgIdx}`}
                              name={`primary_${varIdx}`}
                              checked={img.is_primary}
                              onChange={() => {
                                console.log(`⭐ [ProductFormDialog] Setting ${img.angle} as primary for variation ${varIdx}`)
                                const images = variation.images.map((image, i) => ({ ...image, is_primary: i === imgIdx }))
                                updateVariation(varIdx, { images })
                              }}
                            />
                            <Label htmlFor={`primary_${varIdx}_${imgIdx}`} className="text-xs text-slate-600">
                              Primary Image
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* No Images Message */}
                    {variation.images.length === 0 && (
                      <div className="text-center py-4 text-slate-500 border-2 border-dashed border-slate-300 rounded-lg">
                        <p className="text-sm">No images added yet</p>
                        <p className="text-xs mt-1">Click on an angle button above to add images</p>
                      </div>
                    )}
                  </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <Separator />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              {t.cancel}
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-[#634c9f] to-[#7a5ec7] hover:from-[#584289] hover:to-[#6b52b3] text-white shadow-lg" disabled={isSubmitting}>
              {isSubmitting ? t.creating : isEdit ? t.updateProduct : t.createProduct}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}