"use client"

import { useFormik } from "formik"
import * as Yup from "yup"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/ui/file-upload"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import type { Template, CreateTemplateData, UpdateTemplateData } from "@/types"
import type { FormikHelpers } from "formik"

const templateSchema = Yup.object().shape({
  name: Yup.string().required("Template name is required").min(2, "Name must be at least 2 characters"),
  category: Yup.string().required("Category is required"),
  image: Yup.string().required("Image is required"),
  price: Yup.mixed().test("price-validation", "Price must be a valid number or 'free'", function (value) {
    if (value === "free") return true
    if (typeof value === "number" && value >= 0) return true
    return false
  }),
})

interface TemplateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: Partial<Template>
  onSubmit: (
    values: any,
    formikHelpers: FormikHelpers<any>
  ) => Promise<void>
  t: any
  isSubmitting: boolean
  isEdit: boolean
}

const templateCategories = [
  "Business",
  "Abstract",
  "Outdoor",
  "Text",
  "Sports",
  "Music",
  "Art",
  "Technology",
  "Nature",
  "Geometric",
  "Vintage",
  "Modern",
]

export function TemplateFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  t,
  isSubmitting,
  isEdit,
}: TemplateFormDialogProps) {
  const formik = useFormik({
    initialValues: {
      name: initialValues.name || "",
      category: initialValues.category || "",
      image: initialValues.image || "",
      price: initialValues.price || "free",
      isFree: initialValues.price === "free",
    },
    validationSchema: templateSchema,
    onSubmit: async (values, formikHelpers) => {
      const templateData = {
        name: values.name,
        category: values.category,
        image: values.image,
        price: values.isFree ? "free" : Number(values.price),
      }

      if (isEdit && initialValues.id) {
        await onSubmit({ id: initialValues.id, ...templateData } as UpdateTemplateData, formikHelpers)
      } else {
        await onSubmit(templateData as CreateTemplateData, formikHelpers)
      }
    },
    enableReinitialize: true,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Template" : "Add New Template"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter template name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={formik.touched.name && formik.errors.name ? "border-red-500" : ""}
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-sm text-red-500">{formik.errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formik.values.category}
              onValueChange={(value) => formik.setFieldValue("category", value)}
            >
              <SelectTrigger className={formik.touched.category && formik.errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {templateCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.category && formik.errors.category && (
              <p className="text-sm text-red-500">{formik.errors.category}</p>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Template Image</Label>
            <FileUpload
              value={formik.values.image}
              onChange={(url) => formik.setFieldValue("image", url)}
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
              className="w-full"
            />
            {formik.touched.image && formik.errors.image && (
              <p className="text-sm text-red-500">{formik.errors.image}</p>
            )}
          </div>

          <Separator />

          {/* Price Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFree"
                checked={formik.values.isFree}
                onCheckedChange={(checked) => {
                  formik.setFieldValue("isFree", checked)
                  if (checked) {
                    formik.setFieldValue("price", "free")
                  } else {
                    formik.setFieldValue("price", 0)
                  }
                }}
              />
              <Label htmlFor="isFree" className="text-sm font-medium">
                Free Template
              </Label>
            </div>

            {!formik.values.isFree && (
              <div className="space-y-2">
                <Label htmlFor="price">Price (Kr)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formik.values.price === "free" ? "" : formik.values.price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={formik.touched.price && formik.errors.price ? "border-red-500" : ""}
                />
                {formik.touched.price && formik.errors.price && (
                  <p className="text-sm text-red-500">{formik.errors.price}</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-[#634c9e] to-[#7a5ec7] hover:from-[#584289] hover:to-[#6b52b3] text-white shadow-lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEdit ? "Update Template" : "Create Template"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 