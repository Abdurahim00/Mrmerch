import React, { useEffect, useMemo, useRef } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, AlertCircle } from "lucide-react"
import type { Coupon, CreateCouponData, UpdateCouponData } from "@/types"

interface CouponFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: Partial<Coupon>
  onSubmit: (values: CreateCouponData | UpdateCouponData, helpers: any) => void
  t: any
  isSubmitting: boolean
  isEdit: boolean
}

const couponSchema = Yup.object().shape({
  code: Yup.string()
    .required("Coupon code is required")
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must be at most 20 characters")
    .matches(/^[A-Z0-9-_]+$/, "Code can only contain uppercase letters, numbers, hyphens, and underscores"),
  description: Yup.string().max(500, "Description must be at most 500 characters"),
  discountType: Yup.string().oneOf(["percentage", "fixed"]).required("Discount type is required"),
  discountValue: Yup.number()
    .required("Discount value is required")
    .min(0.01, "Discount value must be greater than 0"),
  minimumOrderAmount: Yup.number().min(0, "Minimum order amount must be 0 or greater"),
  maxUsageCount: Yup.number().min(1, "Maximum usage count must be at least 1"),
  validFrom: Yup.date().required("Valid from date is required"),
  validUntil: Yup.date()
    .required("Valid until date is required")
    .min(Yup.ref("validFrom"), "Valid until date must be after valid from date"),
  isActive: Yup.boolean().required(),
})

export const CouponFormDialog: React.FC<CouponFormDialogProps> = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  t,
  isSubmitting,
  isEdit,
}) => {
  // Stable default dates per dialog lifecycle to prevent Formik re-inits
  const defaultFromRef = useRef<string>(new Date().toISOString().slice(0, 16))
  const defaultUntilRef = useRef<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  )

  const initialFormValues = useMemo(
    () => ({
      code: initialValues.code || "",
      description: initialValues.description || "",
      discountType: (initialValues.discountType as "percentage" | "fixed") || "percentage",
      discountValue: initialValues.discountValue ?? 0,
      minimumOrderAmount: initialValues.minimumOrderAmount ?? 0,
      maxUsageCount: initialValues.maxUsageCount ?? undefined,
      isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
      validFrom: initialValues.validFrom
        ? new Date(initialValues.validFrom).toISOString().slice(0, 16)
        : defaultFromRef.current,
      validUntil: initialValues.validUntil
        ? new Date(initialValues.validUntil).toISOString().slice(0, 16)
        : defaultUntilRef.current,
    }),
    [
      initialValues.code,
      initialValues.description,
      initialValues.discountType,
      initialValues.discountValue,
      initialValues.minimumOrderAmount,
      initialValues.maxUsageCount,
      initialValues.isActive,
      initialValues.validFrom,
      initialValues.validUntil,
    ]
  )

  const formik = useFormik({
    initialValues: initialFormValues,
    validationSchema: couponSchema,
    onSubmit: (values, helpers) => {
      const submitData = {
        ...values,
        id: isEdit ? (initialValues as Coupon).id : undefined,
        code: values.code.toUpperCase(),
        validFrom: new Date(values.validFrom),
        validUntil: new Date(values.validUntil),
        minimumOrderAmount: values.minimumOrderAmount || undefined,
        maxUsageCount: values.maxUsageCount || undefined,
      }
      onSubmit(submitData as any, helpers)
    },
    enableReinitialize: true,
  })

  // Custom validation for discount value based on type
  const validateDiscountValue = (value: number, type: string) => {
    if (type === "percentage" && (value < 0 || value > 100)) {
      return "Percentage must be between 0 and 100"
    }
    if (type === "fixed" && value < 0) {
      return "Fixed amount must be positive"
    }
    return ""
  }

  const discountValueError = validateDiscountValue(formik.values.discountValue, formik.values.discountType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {isEdit ? "Edit Coupon" : "Create New Coupon"}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {isEdit 
              ? "Update the coupon details below." 
              : "Create a new discount coupon for your customers."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coupon Code */}
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                Coupon Code *
              </Label>
              <Input
                id="code"
                type="text"
                // placeholder="WELCOME10"
                value={formik.values.code}
                onChange={(e) => formik.setFieldValue("code", e.target.value.toUpperCase())}
                onBlur={formik.handleBlur}
                className={formik.touched.code && formik.errors.code ? "border-red-500" : ""}
              />
              {formik.touched.code && formik.errors.code && (
                <p className="text-sm text-red-600">{formik.errors.code}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="isActive"
                  checked={formik.values.isActive}
                  onCheckedChange={(checked) => formik.setFieldValue("isActive", checked)}
                />
                <Label htmlFor="isActive" className="text-sm">
                  {formik.values.isActive ? "Active" : "Inactive"}
                </Label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Welcome discount for new customers"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              rows={3}
              className={formik.touched.description && formik.errors.description ? "border-red-500" : ""}
            />
            {formik.touched.description && formik.errors.description && (
              <p className="text-sm text-red-600">{formik.errors.description}</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Discount Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Discount Type *</Label>
              <Select
                value={formik.values.discountType}
                onValueChange={(value) => {
                  formik.setFieldValue("discountType", value)
                  formik.setFieldValue("discountValue", 0) // Reset value when type changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (SEK)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Value */}
            <div className="space-y-2">
              <Label htmlFor="discountValue" className="text-sm font-medium">
                Discount Value *
              </Label>
              <div className="relative">
                <Input
                  id="discountValue"
                  type="number"
                  step={formik.values.discountType === "percentage" ? "1" : "0.01"}
                  min="0"
                  max={formik.values.discountType === "percentage" ? "100" : undefined}
                  placeholder={formik.values.discountType === "percentage" ? "10" : "50.00"}
                  value={formik.values.discountValue}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    (formik.touched.discountValue && formik.errors.discountValue) || discountValueError
                      ? "border-red-500"
                      : ""
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-sm text-slate-500">
                    {formik.values.discountType === "percentage" ? "%" : "SEK"}
                  </span>
                </div>
              </div>
              {((formik.touched.discountValue && formik.errors.discountValue) || discountValueError) && (
                <p className="text-sm text-red-600">
                  {formik.errors.discountValue || discountValueError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Minimum Order Amount */}
            <div className="space-y-2">
              <Label htmlFor="minimumOrderAmount" className="text-sm font-medium">
                Minimum Order Amount (SEK)
              </Label>
              <Input
                id="minimumOrderAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={formik.values.minimumOrderAmount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={formik.touched.minimumOrderAmount && formik.errors.minimumOrderAmount ? "border-red-500" : ""}
              />
              {formik.touched.minimumOrderAmount && formik.errors.minimumOrderAmount && (
                <p className="text-sm text-red-600">{formik.errors.minimumOrderAmount}</p>
              )}
              <p className="text-xs text-slate-500">Leave empty for no minimum requirement</p>
            </div>

            {/* Max Usage Count */}
            <div className="space-y-2">
              <Label htmlFor="maxUsageCount" className="text-sm font-medium">
                Maximum Usage Count
              </Label>
              <Input
                id="maxUsageCount"
                type="number"
                min="1"
                placeholder="100"
                value={formik.values.maxUsageCount || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={formik.touched.maxUsageCount && formik.errors.maxUsageCount ? "border-red-500" : ""}
              />
              {formik.touched.maxUsageCount && formik.errors.maxUsageCount && (
                <p className="text-sm text-red-600">{formik.errors.maxUsageCount}</p>
              )}
              <p className="text-xs text-slate-500">Leave empty for unlimited usage</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Valid From */}
            <div className="space-y-2">
              <Label htmlFor="validFrom" className="text-sm font-medium">
                Valid From *
              </Label>
              <Input
                id="validFrom"
                type="datetime-local"
                value={formik.values.validFrom}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={formik.touched.validFrom && formik.errors.validFrom ? "border-red-500" : ""}
              />
              {formik.touched.validFrom && formik.errors.validFrom && (
                <p className="text-sm text-red-600">{formik.errors.validFrom}</p>
              )}
            </div>

            {/* Valid Until */}
            <div className="space-y-2">
              <Label htmlFor="validUntil" className="text-sm font-medium">
                Valid Until *
              </Label>
              <Input
                id="validUntil"
                type="datetime-local"
                value={formik.values.validUntil}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={formik.touched.validUntil && formik.errors.validUntil ? "border-red-500" : ""}
              />
              {formik.touched.validUntil && formik.errors.validUntil && (
                <p className="text-sm text-red-600">{formik.errors.validUntil}</p>
              )}
            </div>
          </div>

          {isEdit && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Changes to this coupon will take effect immediately. Be careful when modifying active coupons.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !!discountValueError}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Saving..." : (isEdit ? "Update Coupon" : "Create Coupon")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
