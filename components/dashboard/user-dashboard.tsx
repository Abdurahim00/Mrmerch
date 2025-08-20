"use client"

import { useState, useEffect } from "react"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { fetchOrders } from "@/lib/redux/slices/ordersSlice"
import { fetchDesigns, deleteDesign } from "@/lib/redux/slices/designsSlice"
import { toast } from "sonner"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { translations } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Palette, MapPin, Package, Edit3, Copy, Trash2, ArrowUpRight } from "lucide-react" // Added Edit3, Copy, Trash2
import Image from "next/image"
import { useSession } from "next-auth/react" // Import useSession

export function UserDashboard({ defaultTab = "orders" }: { defaultTab?: string }) {
  const dispatch = useAppDispatch()
  const { data: session } = useSession() // Get session data
  const { items: orders, loading: ordersLoading } = useAppSelector((state) => state.orders)
  const { items: designs, loading: designsLoading } = useAppSelector((state) => state.designs) // New designs state
  const { language } = useAppSelector((state) => state.app)
  const t = translations[language]
  
  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [designToDelete, setDesignToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Handle delete design
  const handleDeleteDesign = async () => {
    if (!designToDelete) return
    
    try {
      setIsDeleting(true)
      const resultAction = await dispatch(deleteDesign(designToDelete) as any)
      
      if (deleteDesign.fulfilled.match(resultAction)) {
        toast.success("Design deleted successfully")
      } else {
        toast.error("Failed to delete design")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setDesignToDelete(null)
    }
  }

  const user = session?.user as any

  // Filter orders for current user
  const userOrders = orders.filter((order) => order.customer === user?.customerNumber)
  // Filter designs by user ID and exclude a specific unwanted id
  const userDesigns = designs
    .filter((design) => design.userId === (user as any)?.id)
    .filter((design) => design.id !== "689784db262033d62185e0bc")

  // Use document visibility API to prevent unnecessary API calls
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [lastFetch, setLastFetch] = useState(0);
  const REFRESH_THRESHOLD = 300000; // 5 minutes in milliseconds

  // Only fetch on mount, visibility change, and user change - with time threshold
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isNowVisible = !document.hidden;
      setIsVisible(isNowVisible);
      
      // Only refetch if becoming visible AND the threshold time has passed
      if (isNowVisible && Date.now() - lastFetch > REFRESH_THRESHOLD) {
        if (user?.customerNumber) {
          dispatch(fetchOrders());
        }
        if ((user as any)?.id) {
          dispatch(fetchDesigns((user as any).id));
        }
        setLastFetch(Date.now());
      }
    };

    // Initial fetch when component mounts
    if (lastFetch === 0) {
      if (user?.customerNumber) {
        dispatch(fetchOrders());
      }
      if ((user as any)?.id) {
        dispatch(fetchDesigns((user as any).id));
      }
      setLastFetch(Date.now());
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dispatch, user, lastFetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "In Production":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "Printing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getDesignStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "In Review":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const OrderHistorySkeleton = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[100px]">Order ID</TableHead>
            <TableHead className="min-w-[100px]">Date</TableHead>
            <TableHead className="min-w-[100px]">Status</TableHead>
            <TableHead className="min-w-[100px]">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const DesignsSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="overflow-hidden border-primary/10 dark:border-primary/20">
          <div className="relative">
            <Skeleton className="w-full h-40" />
            <div className="absolute top-3 right-3">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="h-9 flex-1 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-primary/20 dark:border-primary/30 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary dark:text-primary/90">
                {t.clientDashboard}
              </h2>
              <p className="text-primary/70 dark:text-primary/60 mt-1">
                {t.customerNumber}: <span className="font-mono font-semibold">{user?.customerNumber}</span>
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-sm text-primary/70 dark:text-primary/60">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary dark:text-primary/90">{userOrders.length}</div>
                <div>{t.totalOrders}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary dark:text-primary/90">{userDesigns.length}</div>
                <div>{t.savedDesigns}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 h-auto">
          <TabsTrigger value="orders" className="flex items-center gap-2 py-3">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t.orderHistory}</span>
            <span className="sm:hidden">{t.orderHistory}</span>
          </TabsTrigger>
          <TabsTrigger value="designs" className="flex items-center gap-2 py-3">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{t.savedDesigns}</span>
            <span className="sm:hidden">{t.savedDesigns}</span>
          </TabsTrigger>
          
          <TabsTrigger value="profile" className="flex items-center gap-2 py-3">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">{t.billingShippingInfo}</span>
            <span className="sm:hidden">{t.profile}</span>
          </TabsTrigger>
        </TabsList>
        

        {/* Order History Tab */}
        <TabsContent value="orders" className="mt-6">
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-primary/10 dark:border-primary/20 bg-primary/5 dark:bg-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary dark:text-primary/90">
                <FileText className="h-5 w-5 text-primary" />
                {t.orderHistory}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ordersLoading ? (
                <div className="p-6">
                  <OrderHistorySkeleton />
                </div>
              ) : userOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-primary/10 dark:border-primary/20 bg-primary/5 dark:bg-primary/10">
                        <TableHead className="min-w-[100px] font-bold text-primary py-4 text-sm uppercase tracking-wider">
                          {t.orderId}
                        </TableHead>
                        <TableHead className="min-w-[100px] font-bold text-primary py-4 text-sm uppercase tracking-wider">
                          {t.date}
                        </TableHead>
                        <TableHead className="min-w-[100px] font-bold text-primary py-4 text-sm uppercase tracking-wider">
                          {t.status}
                        </TableHead>
                        <TableHead className="min-w-[100px] font-bold text-primary py-4 text-sm uppercase tracking-wider">
                          {t.total}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userOrders.map((order, index) => (
                        <TableRow
                          key={order.id}
                          className={`border-b transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 ${
                            index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"
                          }`}
                        >
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100 py-4">{order.id}</TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300 py-4">{order.date}</TableCell>
                          <TableCell className="py-4">
                            <Badge className={`${getStatusColor(order.status)} font-medium px-3 py-1 rounded-full text-xs`}>{order.status}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-primary py-4">
                            {order.total.toLocaleString()} SEK
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.noOrdersYet}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">{t.startShopping}</p>
                  <Button asChild className="bg-primary hover:bg-primary/90 text-white">
                    <a href="/products">{t.browseProducts}</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Designs Tab */}
        <TabsContent value="designs" className="mt-6">
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between border-b border-primary/10 dark:border-primary/20 bg-primary/5 dark:bg-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary dark:text-primary/90">
                <Palette className="h-5 w-5 text-primary" />
                {t.savedDesigns}
              </CardTitle>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => window.location.href = '/design-tool'}
              >
                <Palette className="h-4 w-4 mr-2" />
                {t.createNewDesign}
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {designsLoading ? (
                <DesignsSkeleton />
              ) : userDesigns.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {userDesigns.map((design) => (
                    <Card
                      key={design.id}
                      className="overflow-hidden hover:shadow-lg transition-all border-primary/10 dark:border-primary/20 group"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors z-0"></div>
                        <Image
                          src={design.preview || "/placeholder.svg"}
                          alt={design.name}
                          width={300}
                          height={180}
                          className="w-full h-40 object-cover bg-white z-10 relative"
                          priority
                        />
                        <Badge className={`absolute top-3 right-3 ${getDesignStatusColor(design.status)} px-3 py-1 rounded-full text-xs font-medium z-20`}>
                          {t[design.status.toLowerCase() as keyof typeof t] || design.status}
                        </Badge>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-base mb-1 text-slate-900 dark:text-white">{design.name}</h3>
                        <p className="text-sm text-primary mb-2">{design.type}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                           {t.modified}: {new Date((design as any).updatedAt || (design as any).createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        <div className="flex flex-col justify-center align-center gap-3">
                          <div className="flex justify-between gap-3">
                             <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-primary/30 hover:bg-primary/5 hover:border-primary dark:hover:bg-primary/20 transition-colors text-primary"
                            onClick={() => window.location.href = `/design-tool?designId=${design.id}`}
                          >
                            <Edit3 className="h-4 w-4 mr-1.5" /> {t.edit}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-900/20 text-red-600 border-red-200 transition-colors"
                            onClick={() => {
                              setDesignToDelete(design.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1.5" /> {t.delete}
                          </Button>
                          </div>
                          <div className="flex justify-center">
                              <Button
                              size="sm"
                              className="flex-1 border-purple-300 text-white bg-purple-900 hover:bg-purple-800 hover:text-white"
                              onClick={async () => {
                              try {
                                const { store } = await import("@/lib/redux/store")
                                const state: any = store.getState()
                                const userId = (state.auth?.user as any)?.id
                                const categoryId = design?.designData?.product?.categoryId || design?.designData?.categoryId
                                if (!userId || !categoryId) {
                                  return
                                }
                                const { setAppliedCategoryDesign } = await import("@/lib/redux/slices/appSlice")
                                await store.dispatch(setAppliedCategoryDesign({ categoryId, designId: design.id }))
                                // Mirror in app state for immediate UI reactivity
                                await store.dispatch(setAppliedCategoryDesign({ categoryId, designId: design.id }) as any)
                              } catch (e) {
                                // no-op
                              }
                            }}
                          >
                            Preview on other products
                          </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Palette className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.noDesignsFound}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">{t.startDesigningNow}</p>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-white"
                    onClick={() => window.location.href = '/design-tool'}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    {t.createNewDesign}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile & Billing Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-primary/10 dark:border-primary/20 bg-primary/5 dark:bg-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary dark:text-primary/90">
                <MapPin className="h-5 w-5 text-primary" />
                {t.billingShippingInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t.fullName}</Label>
                  <Input id="fullName" defaultValue={user?.fullName || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.phone}</Label>
                <Input id="phone" defaultValue={user?.phone || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t.address}</Label>
                <Input id="address" defaultValue={user?.address || ""} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t.city}</Label>
                  <Input id="city" defaultValue={user?.city || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">{t.postalCode}</Label>
                  <Input id="postalCode" defaultValue={user?.postalCode || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t.country}</Label>
                  <Input id="country" defaultValue={user?.country || ""} />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-md">{t.saveChanges}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your design.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteDesign()
              }}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
