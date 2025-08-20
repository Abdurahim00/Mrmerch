import React, { useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFormik } from "formik"
import * as Yup from "yup"
import type { Subcategory, Category } from "@/types"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  initialValues: Partial<Subcategory>
  categories: Category[]
  onSubmit: (values: Partial<Subcategory>) => void
  isEdit?: boolean
}

const schema = Yup.object().shape({
  name: Yup.string().required("Required"),
  slug: Yup.string().required("Required"),
  categoryId: Yup.string().required("Required"),
})

export const SubcategoryFormDialog: React.FC<Props> = ({ open, onOpenChange, initialValues, categories, onSubmit, isEdit }) => {
  const generateSlug = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
  const slugEditedRef = useRef(false)
  const formik = useFormik({
    initialValues: {
      categoryId: initialValues.categoryId || (categories[0]?.id || ""),
      name: initialValues.name || "",
      slug: initialValues.slug || "",
      isActive: initialValues.isActive ?? true,
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: (values) => onSubmit(values),
  })

  useEffect(() => {
    const name = formik.values.name
    const currentSlug = formik.values.slug
    const auto = generateSlug(name)
    if (!slugEditedRef.current || currentSlug === "") {
      formik.setFieldValue("slug", auto)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.name])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Subcategory" : "Create Subcategory"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={formik.values.categoryId} onValueChange={(v) => formik.setFieldValue("categoryId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input name="name" value={formik.values.name} onChange={formik.handleChange} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              name="slug"
              value={formik.values.slug}
              onChange={(e) => {
                slugEditedRef.current = true
                formik.setFieldValue("slug", generateSlug(e.target.value))
              }}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


