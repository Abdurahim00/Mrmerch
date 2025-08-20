import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useFormik } from "formik"
import * as Yup from "yup"
import type { User } from "@/types"

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: any
  onSubmit: (values: any, helpers: any) => Promise<void>
  t: any
  isSubmitting: boolean
}

const userSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  fullName: Yup.string().required("Full name is required"),
  role: Yup.string().oneOf(["user", "admin", "operations"]).required("Role is required"),
})

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  t,
  isSubmitting,
}) => {
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: userSchema,
    onSubmit,
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {t.editUser}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-user-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.email} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-user-email"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="user@example.com"
              className={
                formik.touched.email && formik.errors.email
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-slate-300 focus:border-sky-500 focus:ring-sky-200"
              }
              disabled
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-sm text-red-600">{formik.errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-user-fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.fullName} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-user-fullName"
              name="fullName"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter full name"
              className={
                formik.touched.fullName && formik.errors.fullName
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-slate-300 focus:border-sky-500 focus:ring-sky-200"
              }
            />
            {formik.touched.fullName && formik.errors.fullName && (
              <p className="text-sm text-red-600">{formik.errors.fullName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-user-role" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.role} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formik.values.role}
              onValueChange={(value) => formik.setFieldValue("role", value)}
            >
              <SelectTrigger
                className={
                  formik.touched.role && formik.errors.role
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-slate-300 focus:border-sky-500 focus:ring-sky-200"
                }
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t.user}</SelectItem>
                <SelectItem value="admin">{t.admin}</SelectItem>
                <SelectItem value="operations">{t.operations}</SelectItem>
              </SelectContent>
            </Select>
            {formik.touched.role && formik.errors.role && (
              <p className="text-sm text-red-600">{formik.errors.role}</p>
            )}
          </div>
          <Separator />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              {t.cancel}
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-[#634c9e] to-[#7a5ec7] hover:from-[#584289] hover:to-[#6b52b3] text-white shadow-lg" disabled={isSubmitting}>
              {isSubmitting ? t.updating : t.updateUser}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}