"use client"

import { useState, useEffect, useMemo } from "react"
import * as Yup from "yup"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { fetchProductsPaginated, createProduct, updateProduct, deleteProduct, setPage, setSearchTerm, setSelectedCategory } from "@/lib/redux/slices/productsSlice"
import { fetchUsers, updateUser, deleteUser } from "@/lib/redux/slices/usersSlice"
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate } from "@/lib/redux/slices/templatesSlice"
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from "@/lib/redux/slices/couponsSlice"
import { translations } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaginationWithInfo } from "@/components/ui/pagination"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { 
  Users, 
  Package, 
  Plus, 
  Search, 
  ImageIcon,
  Ticket,
  BarChart3,
  FolderTree,
  Shield,
  LogOut,
  User
} from "lucide-react"
import { toast } from "sonner"
import type { Product, User as UserType, Template, Coupon } from "@/types"
import type { FormikHelpers } from "formik"
import type { CreateTemplateData, CreateCouponData, UpdateCouponData, Category, Subcategory } from "@/types"
import { fetchCategories, fetchSubcategories, deleteCategory as deleteCategoryThunk, deleteSubcategory as deleteSubcategoryThunk, createCategory as createCategoryThunk, updateCategory as updateCategoryThunk, createSubcategory as createSubcategoryThunk, updateSubcategory as updateSubcategoryThunk } from "@/lib/redux/slices/categoriesSlice"

// Import table components
import { UserTable } from "./common/UserTable"
import { ProductTable } from "./common/ProductTable"
import { TemplateTable } from "./common/TemplateTable"
import { CouponTable } from "./common/CouponTable"
import { CategoryTable } from "./common/CategoryTable"
import { SubcategoryTable } from "./common/SubcategoryTable"
import { CategoryFormDialog } from "./common/CategoryFormDialog"
import { SubcategoryFormDialog } from "./common/SubcategoryFormDialog"

// Import form dialog components  
import { ProductFormDialog } from "./common/ProductFormDialog"
import { UserFormDialog } from "./common/UserFormDialog"
import { TemplateFormDialog } from "./common/TemplateFormDialog"
import { CouponFormDialog } from "./common/CouponFormDialog"

type AdminPage = "users" | "products" | "templates" | "coupons" | "categories" | "subcategories" | "analytics"

interface AdminDashboardNewProps {
  onLogout?: () => void
}

export function AdminDashboardNew({ onLogout }: AdminDashboardNewProps) {
  const dispatch = useAppDispatch()
  const { 
    items: products, 
    loading: productsLoading, 
    pagination,
    searchTerm,
    selectedCategory
  } = useAppSelector((state) => state.products)
  const { items: users, loading: usersLoading } = useAppSelector((state) => state.users)
  const { items: templates, loading: templatesLoading } = useAppSelector((state) => state.templatesManagement)
  const { items: coupons, loading: couponsLoading } = useAppSelector((state) => state.coupons)
  const { categories, subcategories } = useAppSelector((state) => (state as any).categories)
  const { language } = useAppSelector((state) => state.app)
  const t = translations[language]

  const [activePage, setActivePage] = useState<AdminPage>("users")
  
  // State for all dialogs
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false)
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  
  const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] = useState(false)
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  
  const [isAddCouponDialogOpen, setIsAddCouponDialogOpen] = useState(false)
  const [isEditCouponDialogOpen, setIsEditCouponDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [isAddSubcategoryOpen, setIsAddSubcategoryOpen] = useState(false)
  const [isEditSubcategoryOpen, setIsEditSubcategoryOpen] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  const newCouponInitial = useMemo(() => ({} as Partial<Coupon>), [])

  // Search and filter states
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [selectedProductCategory, setSelectedProductCategory] = useState("all")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [selectedUserRole, setSelectedUserRole] = useState("all")
  const [templateSearchTerm, setTemplateSearchTerm] = useState("")
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState("all")
  const [couponSearchTerm, setCouponSearchTerm] = useState("")

  useEffect(() => {
    dispatch(fetchProductsPaginated({ page: 1, limit: 10 }))
    dispatch(fetchUsers())
    dispatch(fetchTemplates())
    dispatch(fetchCoupons())
    dispatch(fetchCategories())
    dispatch(fetchSubcategories())
  }, [dispatch])

  // Menu items for sidebar (Analytics on top as requested)
  const menuItems = [
    {
      id: "analytics" as AdminPage,
      label: "Analytics",
      icon: BarChart3,
      count: null,
    },
    {
      id: "users" as AdminPage,
      label: "Manage Users",
      icon: Users,
      count: users.length,
    },
    {
      id: "products" as AdminPage,
      label: "Manage Products",
      icon: Package,
      count: products.length,
    },
    {
      id: "templates" as AdminPage,
      label: "Manage Templates",
      icon: ImageIcon,
      count: templates.length,
    },
    {
      id: "coupons" as AdminPage,
      label: "Manage Coupons",
      icon: Ticket,
      count: coupons.length,
    },
    {
      id: "categories" as AdminPage,
      label: "Manage Categories",
      icon: FolderTree,
      count: categories.length,
    },
    {
      id: "subcategories" as AdminPage,
      label: "Manage Subcategories",
      icon: FolderTree,
      count: subcategories.length,
    },
  ]

  // Handle pagination and search
  const handlePageChange = (page: number) => {
    dispatch(setPage(page))
    dispatch(fetchProductsPaginated({ 
      page, 
      limit: pagination.limit,
      search: searchTerm,
      categoryId: selectedCategory
    }))
  }

  const handleSearchChange = (term: string) => {
    dispatch(setSearchTerm(term))
    dispatch(fetchProductsPaginated({ 
      page: 1, 
      limit: pagination.limit,
      search: term,
      categoryId: selectedCategory
    }))
  }

  const handleCategoryChange = (categoryId: string) => {
    dispatch(setSelectedCategory(categoryId))
    dispatch(fetchProductsPaginated({ 
      page: 1, 
      limit: pagination.limit,
      search: searchTerm,
      categoryId
    }))
  }

  const filteredUsers = users.filter(
    (user) =>
      (selectedUserRole === "all" || user.role === selectedUserRole) &&
      (user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.customerNumber.toLowerCase().includes(userSearchTerm.toLowerCase())),
  )

  const filteredTemplates = templates.filter(
    (template) =>
      (selectedTemplateCategory === "all" || template.category === selectedTemplateCategory) &&
      template.name.toLowerCase().includes(templateSearchTerm.toLowerCase()),
  )

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(couponSearchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(couponSearchTerm.toLowerCase()),
  )

  // Event handlers
  const handleAddProduct = async (
    values: { name: string; price: string; categoryId: string; description: string; image: string },
    { setSubmitting, resetForm }: FormikHelpers<any>
  ) => {
    try {
      const productData = {
        ...values,
        price: Number.parseFloat(values.price),
        image: values.image || "/placeholder.svg?height=300&width=400",
        inStock: true,
      }
      await dispatch(createProduct(productData))
      toast.success(t.productCreated.replace("{productName}", values.name))
      setIsAddProductDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error(t.failedToCreateProduct)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProduct = async (
    values: { name: string; price: string; categoryId: string; description: string; image: string },
    { setSubmitting }: FormikHelpers<any>
  ) => {
    if (!editingProduct) return
    try {
      const productData = {
        ...editingProduct,
        ...values,
        price: Number.parseFloat(values.price),
      }
      await dispatch(updateProduct(productData))
      toast.success(t.productUpdated.replace("{productName}", values.name))
      setIsEditProductDialogOpen(false)
      setEditingProduct(null)
    } catch (error) {
      toast.error(t.failedToUpdateProduct)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditUser = async (
    values: { id: string; email: string; fullName: string; role: "user" | "admin" | "operations"; customerNumber: string },
    { setSubmitting }: FormikHelpers<any>
  ) => {
    try {
      await dispatch(updateUser(values as UserType))
      toast.success(t.userUpdated)
      setIsEditUserDialogOpen(false)
      setEditingUser(null)
    } catch (error) {
      toast.error(t.failedToUpdateUser)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddTemplate = async (
    values: CreateTemplateData,
    { setSubmitting, resetForm }: FormikHelpers<any>
  ) => {
    try {
      await dispatch(createTemplate(values))
      toast.success(`Template "${values.name}" created successfully`)
      setIsAddTemplateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create template")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditTemplate = async (
    values: any,
    { setSubmitting }: FormikHelpers<any>
  ) => {
    try {
      await dispatch(updateTemplate(values))
      toast.success(`Template "${values.name}" updated successfully`)
      setIsEditTemplateDialogOpen(false)
      setEditingTemplate(null)
    } catch (error) {
      toast.error("Failed to update template")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddCoupon = async (
    values: CreateCouponData,
    { setSubmitting, resetForm }: FormikHelpers<any>
  ) => {
    try {
      await dispatch(createCoupon(values))
      await dispatch(fetchCoupons())
      toast.success(`Coupon "${values.code}" created successfully`)
      setIsAddCouponDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create coupon")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditCoupon = async (
    values: UpdateCouponData,
    { setSubmitting }: FormikHelpers<any>
  ) => {
    try {
      await dispatch(updateCoupon(values))
      toast.success(`Coupon "${values.code}" updated successfully`)
      setIsEditCouponDialogOpen(false)
      setEditingCoupon(null)
    } catch (error) {
      toast.error("Failed to update coupon")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(t.confirmDeleteProduct.replace("{productName}", name))) {
      try {
        await dispatch(deleteProduct(id))
        toast.success(t.productDeleted.replace("{productName}", name))
      } catch (error) {
        toast.error(t.failedToDeleteProduct)
      }
    }
  }

  const handleDeleteUser = async (id: string, email: string) => {
    if (confirm(t.confirmDeleteUser)) {
      try {
        await dispatch(deleteUser(id))
        toast.success(t.userDeleted)
      } catch (error) {
        toast.error(t.failedToDeleteUser)
      }
    }
  }

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete template "${name}"?`)) {
      try {
        await dispatch(deleteTemplate(id))
        toast.success(`Template "${name}" deleted successfully`)
      } catch (error) {
        toast.error("Failed to delete template")
      }
    }
  }

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (confirm(`Are you sure you want to delete coupon "${code}"?`)) {
      try {
        await dispatch(deleteCoupon(id))
        toast.success(`Coupon "${code}" deleted successfully`)
      } catch (error) {
        toast.error("Failed to delete coupon")
      }
    }
  }

  const openEditProductDialog = (product: Product) => {
    setEditingProduct(product)
    setIsEditProductDialogOpen(true)
  }

  const openEditUserDialog = (user: UserType) => {
    setEditingUser(user)
    setIsEditUserDialogOpen(true)
  }

  const openEditTemplateDialog = (template: Template) => {
    setEditingTemplate(template)
    setIsEditTemplateDialogOpen(true)
  }

  const openEditCouponDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setIsEditCouponDialogOpen(true)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "operations":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "user":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    }
  }

  const renderContent = () => {
    switch (activePage) {
      case "users":
        return (
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-4">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Users className="h-5 w-5 text-purple-600" />
                {t.manageUsers}
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="search"
                    placeholder={t.searchUsers}
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                  />
                </div>
                <Select value={selectedUserRole} onValueChange={setSelectedUserRole}>
                  <SelectTrigger className="w-full sm:w-[200px] border-slate-300 focus:border-purple-500 focus:ring-purple-200">
                    <SelectValue placeholder={t.filterByRole} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allRoles}</SelectItem>
                    <SelectItem value="user">{t.userRole}: {t.user}</SelectItem>
                    <SelectItem value="admin">{t.userRole}: {t.admin}</SelectItem>
                    <SelectItem value="operations">{t.userRole}: {t.operations}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <UserTable
                users={filteredUsers.sort((a, b) => a.id.localeCompare(b.id))}
                loading={usersLoading}
                t={t}
                getRoleColor={getRoleColor}
                onEdit={openEditUserDialog}
                onDelete={handleDeleteUser}
              />
            </CardContent>
          </Card>
        )

      case "products":
        return (
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Package className="h-5 w-5 text-purple-600" />
                  {t.manageProductsPrices}
                </CardTitle>
                <Button
                  className="bg-gradient-to-r from-[#634c9e] to-[#7a5ec7] hover:from-[#584289] hover:to-[#6b52b3] text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => setIsAddProductDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addProduct}
                </Button>
              </div>
                             <div className="flex flex-col sm:flex-row gap-4">
                 <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                   <Input
                     type="search"
                     placeholder={t.searchProducts}
                     value={searchTerm}
                     onChange={(e) => handleSearchChange(e.target.value)}
                     className="pl-10 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                   />
                 </div>
                 <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                   <SelectTrigger className="w-full sm:w-[200px] border-slate-300 focus:border-purple-500 focus:ring-purple-200">
                     <SelectValue placeholder={t.filterByCategory} />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All Categories</SelectItem>
                     {categories.map((cat) => (
                       <SelectItem key={cat.id} value={cat.id}>
                         {cat.name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
            </CardHeader>
            <CardContent className="p-0">
                             <ProductTable
                 products={products}
                 loading={productsLoading}
                 t={t}
                 productCategories={categories}
                 onEdit={openEditProductDialog}
                 onDelete={handleDeleteProduct}
               />
               
               {/* Pagination */}
               {pagination.totalPages > 1 && (
                 <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                   <PaginationWithInfo
                     currentPage={pagination.page}
                     totalPages={pagination.totalPages}
                     total={pagination.total}
                     limit={pagination.limit}
                     onPageChange={handlePageChange}
                     className="w-full"
                   />
                 </div>
               )}
            </CardContent>
          </Card>
        )

      case "templates":
        return (
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <ImageIcon className="h-5 w-5 text-purple-600" />
                  Manage Templates
                </CardTitle>
                <Button
                  className="bg-gradient-to-r from-[#634c9e] to-[#7a5ec7] hover:from-[#584289] hover:to-[#6b52b3] text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => setIsAddTemplateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Template
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Search templates..."
                    value={templateSearchTerm}
                    onChange={(e) => setTemplateSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                  />
                </div>
                <Select value={selectedTemplateCategory} onValueChange={setSelectedTemplateCategory}>
                  <SelectTrigger className="w-full sm:w-[200px] border-slate-300 focus:border-purple-500 focus:ring-purple-200">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Abstract">Abstract</SelectItem>
                    <SelectItem value="Outdoor">Outdoor</SelectItem>
                    <SelectItem value="Text">Text</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Music">Music</SelectItem>
                    <SelectItem value="Art">Art</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Nature">Nature</SelectItem>
                    <SelectItem value="Geometric">Geometric</SelectItem>
                    <SelectItem value="Vintage">Vintage</SelectItem>
                    <SelectItem value="Modern">Modern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <TemplateTable
                templates={filteredTemplates}
                loading={templatesLoading}
                t={t}
                onEdit={openEditTemplateDialog}
                onDelete={handleDeleteTemplate}
              />
            </CardContent>
          </Card>
        )

      case "coupons":
        return (
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Ticket className="h-5 w-5 text-purple-600" />
                  Manage Coupons
                </CardTitle>
                <Button
                  className="bg-gradient-to-r from-[#634c9e] to-[#7a5ec7] hover:from-[#584289] hover:to-[#6b52b3] text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => setIsAddCouponDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Coupon
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Search coupons..."
                    value={couponSearchTerm}
                    onChange={(e) => setCouponSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <CouponTable
                coupons={filteredCoupons}
                loading={couponsLoading}
                t={t}
                onEdit={openEditCouponDialog}
                onDelete={handleDeleteCoupon}
              />
            </CardContent>
          </Card>
        )

      case "categories":
        return (
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <FolderTree className="h-5 w-5 text-purple-600" />
                  Manage Categories
                </CardTitle>
                <Button onClick={() => { setIsAddCategoryOpen(true); setEditingCategory(null) }} className="bg-gradient-to-r from-[#634c9e] to-[#7a5ec7] text-white">
                  <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <CategoryTable
                items={categories}
                loading={false}
                onEdit={(c) => { setEditingCategory(c); setIsEditCategoryOpen(true) }}
                onDelete={async (id) => {
                  if (confirm("Delete this category? Related subcategories will be removed.")) {
                    await dispatch(deleteCategoryThunk(id) as any)
                    dispatch(fetchCategories())
                    dispatch(fetchSubcategories())
                  }
                }}
              />
            </CardContent>
          </Card>
        )

      case "subcategories":
        return (
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <FolderTree className="h-5 w-5 text-purple-600" />
                  Manage Subcategories
                </CardTitle>
                <Button onClick={() => { setIsAddSubcategoryOpen(true); setEditingSubcategory(null) }} className="bg-gradient-to-r from-[#634c9e] to-[#7a5ec7] text-white">
                  <Plus className="h-4 w-4 mr-2" /> Add Subcategory
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <SubcategoryTable
                items={subcategories}
                categories={categories}
                loading={false}
                onEdit={(s) => { setEditingSubcategory(s); setIsEditSubcategoryOpen(true) }}
                onDelete={async (id) => {
                  if (confirm("Delete this subcategory?")) {
                    await dispatch(deleteSubcategoryThunk(id) as any)
                    dispatch(fetchSubcategories())
                  }
                }}
              />
            </CardContent>
          </Card>
        )

      case "analytics":
        return (
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Analytics & Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Total Users</p>
                      <p className="text-3xl font-bold text-purple-900">{users.length}</p>
                    </div>
                    <Users className="h-10 w-10 text-purple-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Total Products</p>
                      <p className="text-3xl font-bold text-green-900">{products.length}</p>
                    </div>
                    <Package className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Total Templates</p>
                      <p className="text-3xl font-bold text-purple-900">{templates.length}</p>
                    </div>
                    <ImageIcon className="h-10 w-10 text-purple-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Total Coupons</p>
                      <p className="text-3xl font-bold text-orange-900">{coupons.length}</p>
                    </div>
                    <Ticket className="h-10 w-10 text-orange-600" />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-slate-600 dark:text-slate-400 text-center">
                  More detailed analytics and reports coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-900">
        <Sidebar className="border-r border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-purple-50 dark:from-slate-900 dark:to-slate-950">
          <SidebarHeader className="border-b border-slate-200 dark:border-slate-800 p-4 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950/30">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="flex flex-col">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Panel</h2>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Management Dashboard</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm sm:text-base font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-widest mb-3">
                Management
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activePage === item.id}
                        onClick={() => setActivePage(item.id)}
                        className={`w-full justify-between rounded-md transition-colors duration-150 ${
                          activePage === item.id
                            ? "bg-purple-900 text-white"
                            : "hover:bg-purple-800 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.count !== null && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.count}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="border-t border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">Admin User</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
              </div>
              {onLogout && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLogout}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1 overflow-x-hidden [--scrollbar-size:0px]">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-4 bg-white dark:bg-slate-900">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              {(() => {
                const active = menuItems.find((item) => item.id === activePage)
                if (!active) return null
                const ActiveIcon = active.icon
                return (
                  <>
                    <ActiveIcon className="h-5 w-5 text-purple-600" />
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{active.label}</h1>
                  </>
                )
              })()}
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>

      {/* All Dialog Components */}
      <ProductFormDialog
        open={isAddProductDialogOpen}
        onOpenChange={setIsAddProductDialogOpen}
        initialValues={{ name: "", price: "", categoryId: "", description: "", image: "" }}
        onSubmit={handleAddProduct}
        t={t}
        productCategories={categories}
        isSubmitting={false}
        isEdit={false}
      />

      <ProductFormDialog
        open={isEditProductDialogOpen}
        onOpenChange={setIsEditProductDialogOpen}
        initialValues={editingProduct || { name: "", price: "", categoryId: "", description: "", image: "" }}
        onSubmit={handleEditProduct}
        t={t}
        productCategories={categories}
        isSubmitting={false}
        isEdit={true}
      />

      <UserFormDialog
        open={isEditUserDialogOpen}
        onOpenChange={setIsEditUserDialogOpen}
        initialValues={editingUser || { id: "", email: "", fullName: "", role: "user", customerNumber: "" }}
        onSubmit={handleEditUser}
        t={t}
        isSubmitting={false}
      />

      <TemplateFormDialog
        open={isAddTemplateDialogOpen}
        onOpenChange={setIsAddTemplateDialogOpen}
        initialValues={{ name: "", category: "", image: "", price: "free" }}
        onSubmit={handleAddTemplate}
        t={t}
        isSubmitting={false}
        isEdit={false}
      />

      <TemplateFormDialog
        open={isEditTemplateDialogOpen}
        onOpenChange={setIsEditTemplateDialogOpen}
        initialValues={editingTemplate || { name: "", category: "", image: "", price: "free" }}
        onSubmit={handleEditTemplate}
        t={t}
        isSubmitting={false}
        isEdit={true}
      />

      <CouponFormDialog
        key={isAddCouponDialogOpen ? 'create-coupon' : 'create-coupon-closed'}
        open={isAddCouponDialogOpen}
        onOpenChange={setIsAddCouponDialogOpen}
        initialValues={newCouponInitial}
        onSubmit={(v: any, helpers: any) => handleAddCoupon(v as CreateCouponData, helpers)}
        t={t}
        isSubmitting={false}
        isEdit={false}
      />

      <CouponFormDialog
        key={editingCoupon?.id || 'edit-coupon'}
        open={isEditCouponDialogOpen}
        onOpenChange={setIsEditCouponDialogOpen}
        initialValues={editingCoupon || {}}
        onSubmit={(v: any, helpers: any) => handleEditCoupon(v as UpdateCouponData, helpers)}
        t={t}
        isSubmitting={false}
        isEdit={true}
      />

      {/* Category Dialogs */}
      <CategoryFormDialog
        open={isAddCategoryOpen}
        onOpenChange={setIsAddCategoryOpen}
        initialValues={{}}
        onSubmit={async (values) => {
          await dispatch(createCategoryThunk(values as any) as any)
          setIsAddCategoryOpen(false)
          dispatch(fetchCategories())
        }}
      />
      <CategoryFormDialog
        open={isEditCategoryOpen}
        onOpenChange={setIsEditCategoryOpen}
        initialValues={editingCategory || {}}
        onSubmit={async (values) => {
          await dispatch(updateCategoryThunk({ id: editingCategory!.id, ...values } as any) as any)
          setIsEditCategoryOpen(false)
          setEditingCategory(null)
          dispatch(fetchCategories())
        }}
        isEdit
      />

      {/* Subcategory Dialogs */}
      <SubcategoryFormDialog
        open={isAddSubcategoryOpen}
        onOpenChange={setIsAddSubcategoryOpen}
        initialValues={{}}
        categories={categories}
        onSubmit={async (values) => {
          await dispatch(createSubcategoryThunk(values as any) as any)
          setIsAddSubcategoryOpen(false)
          dispatch(fetchSubcategories())
        }}
      />
      <SubcategoryFormDialog
        open={isEditSubcategoryOpen}
        onOpenChange={setIsEditSubcategoryOpen}
        initialValues={editingSubcategory || {}}
        categories={categories}
        onSubmit={async (values) => {
          await dispatch(updateSubcategoryThunk({ id: editingSubcategory!.id, ...values } as any) as any)
          setIsEditSubcategoryOpen(false)
          setEditingSubcategory(null)
          dispatch(fetchSubcategories())
        }}
        isEdit
      />
    </SidebarProvider>
  )
}
