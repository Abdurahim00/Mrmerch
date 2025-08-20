import React, { useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useFormik } from "formik"
import * as Yup from "yup"
import type { Category } from "@/types"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  initialValues: Partial<Category>
  onSubmit: (values: Partial<Category>) => void
  isEdit?: boolean
}

const schema = Yup.object().shape({
  name: Yup.string().required("Required"),
  slug: Yup.string().required("Required"),
})

export const CategoryFormDialog: React.FC<Props> = ({ open, onOpenChange, initialValues, onSubmit, isEdit }) => {
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
      name: initialValues.name || "",
      slug: initialValues.slug || "",
      description: initialValues.description || "",
      isActive: initialValues.isActive ?? true,
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: (values) => onSubmit(values),
  })

  useEffect(() => {
    // Auto-generate slug when user types name unless slug manually changed
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
          <DialogTitle>{isEdit ? "Edit Category" : "Create Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
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
          <div className="space-y-2">
            <Label>Description</Label>
            <Input name="description" value={formik.values.description} onChange={formik.handleChange} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formik.values.isActive} onCheckedChange={(v) => formik.setFieldValue("isActive", v)} />
            <Label>Active</Label>
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


