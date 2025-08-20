"use client"

import { useEffect, useState } from "react"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { fetchOrders, updateOrderStatus } from "@/lib/redux/slices/ordersSlice"
import { translations } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { FileArchive, Package, Clock, Printer, Truck, CheckCircle, User, ImageIcon, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { Order } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { downloadOrderPDF } from "@/lib/utils/pdfExport"
import { DesignCanvasRenderer } from "@/components/DesignCanvasRenderer"
import { DesignElementsSummary } from "@/components/DesignElementsSummary"

export function OperationsDashboard() {
  const dispatch = useAppDispatch()
  const { items: orders, loading } = useAppSelector((state) => state.orders)
  const { language } = useAppSelector((state) => state.app)
  const t = translations[language]

  // Use document visibility API to prevent unnecessary API calls
  const [isVisible, setIsVisible] = useState(true); // Default to true for SSR
  const [lastFetch, setLastFetch] = useState(0);
  const REFRESH_THRESHOLD = 300000; // 5 minutes in milliseconds

  // Order details modal state
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null)
  
  // Initialize visibility state safely on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsVisible(!document.hidden);
    }
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const handleVisibilityChange = () => {
      const isNowVisible = !document.hidden;
      setIsVisible(isNowVisible);
      
      // Only refetch if becoming visible AND the threshold time has passed
      if (isNowVisible && Date.now() - lastFetch > REFRESH_THRESHOLD) {
        dispatch(fetchOrders());
        setLastFetch(Date.now());
      }
    };

    // Initial fetch when component mounts
    if (lastFetch === 0) {
      dispatch(fetchOrders());
      setLastFetch(Date.now());
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dispatch, lastFetch])

  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap()
      toast.success(t.orderStatusChanged.replace("{orderId}", orderId).replace("{newStatus}", newStatus))
    } catch (error) {
      toast.error(t.failedToUpdateOrder)
    }
  }

  const handleExportPrintFile = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId)
      if (!order) {
        toast.error('Order not found')
        return
      }
      
      toast.success(`Generating PDF for order ${orderId}...`)
      
      // Generate and download PDF
      downloadOrderPDF(order)
      
      toast.success(`PDF generated successfully for order ${orderId}`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "Queued":
        return <Clock className="h-4 w-4" />
      case "Printing":
        return <Printer className="h-4 w-4" />
      case "In Production":
        return <Package className="h-4 w-4" />
      case "Shipped":
        return <Truck className="h-4 w-4" />
      case "Completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Queued":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "Printing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "In Production":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const statusOptions: Order["status"][] = ["Queued", "Printing", "In Production", "Shipped", "Completed"]

  // Calculate stats
  const totalOrders = orders.length
  const queuedOrders = orders.filter((o) => o.status === "Queued").length
  const inProductionOrders = orders.filter((o) => o.status === "In Production" || o.status === "Printing").length
  const completedOrders = orders.filter((o) => o.status === "Completed").length

  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const OrdersSkeleton = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[100px]">Order ID</TableHead>
            <TableHead className="min-w-[120px]">Customer</TableHead>
            <TableHead className="min-w-[100px]">Date</TableHead>
            <TableHead className="min-w-[120px]">Status</TableHead>
            <TableHead className="min-w-[150px]">Update Status</TableHead>
            <TableHead className="min-w-[150px]">Export Print File</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-32" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Operations Stats */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t.totalOrders}</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalOrders}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{t.inQueue}</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{queuedOrders}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{t.inProduction}</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{inProductionOrders}</p>
                </div>
                <Printer className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">{t.completed}</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{completedOrders}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Orders Queue */}
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Package className="h-5 w-5 text-sky-600" />
            {t.activeOrdersQueue}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <OrdersSkeleton />
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableHead className="min-w-[100px] font-semibold text-slate-700 dark:text-slate-300">
                      {t.orderId}
                    </TableHead>
                    <TableHead className="min-w-[120px] font-semibold text-slate-700 dark:text-slate-300">
                      {t.customer}
                    </TableHead>
                    <TableHead className="min-w-[100px] font-semibold text-slate-700 dark:text-slate-300">
                      {t.date}
                    </TableHead>
                    <TableHead className="min-w-[120px] font-semibold text-slate-700 dark:text-slate-300">
                      {t.status}
                    </TableHead>
                    <TableHead className="min-w-[150px] font-semibold text-slate-700 dark:text-slate-300">
                      {t.updateStatus}
                    </TableHead>
                    <TableHead className="min-w-[150px] font-semibold text-slate-700 dark:text-slate-300">
                      {t.exportPrintFile}
                    </TableHead>
                    <TableHead className="min-w-[120px] font-semibold text-slate-700 dark:text-slate-300">
                      Items
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, index) => (
                    <TableRow
                      key={order.id}
                      className={`border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"
                      }`}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{order.id}</TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">{order.customer}</TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">{order.date}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 w-fit font-medium`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusUpdate(order.id, value as Order["status"])}
                        >
                          <SelectTrigger className="w-full min-w-[140px] border-slate-300 focus:border-[#634c9e] focus:ring-[#634c9e20]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(status)}
                                  {status}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPrintFile(order.id)}
                          className="w-full min-w-[140px] bg-transparent hover:bg-[#634c9e15] hover:text-[#634c9e] hover:border-[#634c9e40] dark:hover:bg-[#634c9e30]"
                        >
                          <FileArchive className="mr-2 h-4 w-4" />
                          {t.exportPrintFile}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setDetailsOrder(order); setDetailsOpen(true) }}
                          className="w-full min-w-[100px]"
                        >
                          View Items
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.noOrdersInQueue}</h3>
              <p className="text-slate-500 dark:text-slate-400">{t.allOrdersProcessed}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Order {detailsOrder?.id} - Complete Details
            </DialogTitle>
          </DialogHeader>
          
          {detailsOrder && (
            <div className="space-y-6">
              {/* Design Data Summary */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Design Data Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Total Items</p>
                    <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{detailsOrder.items.length}</p>
                  </div>
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">With Design Context</p>
                    <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                      {detailsOrder.items.filter((item: any) => item.designContext).length}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">With Design Canvas</p>
                    <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                      {detailsOrder.items.filter((item: any) => item.designCanvasJSON).length}
                    </p>
                  </div>
                </div>

                {/* Missing Data Warnings */}
                {(() => {
                  const itemsWithoutDesign = detailsOrder.items.filter((item: any) => !item.designContext);
                  const itemsWithoutCanvas = detailsOrder.items.filter((item: any) => !item.designCanvasJSON);
                  
                  if (itemsWithoutDesign.length > 0 || itemsWithoutCanvas.length > 0) {
                    return (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Design Data Issues Detected</span>
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
                          {itemsWithoutDesign.length > 0 && (
                            <div>• {itemsWithoutDesign.length} item(s) missing design context</div>
                          )}
                          {itemsWithoutCanvas.length > 0 && (
                            <div>• {itemsWithoutCanvas.length} item(s) missing design canvas data</div>
                          )}
                          <div className="mt-2 text-xs">
                            These items may not have complete design specifications for production.
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Customer Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Customer Number</p>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{detailsOrder.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Order Date</p>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{detailsOrder.date}</p>
                  </div>
                  {detailsOrder.customerName && (
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Full Name</p>
                      <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{detailsOrder.customerName}</p>
                    </div>
                  )}
                  {detailsOrder.customerEmail && (
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Email</p>
                      <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{detailsOrder.customerEmail}</p>
                    </div>
                  )}
                  {detailsOrder.customerPhone && (
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Phone</p>
                      <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{detailsOrder.customerPhone}</p>
                    </div>
                  )}
                  {detailsOrder.customerAddress && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Address</p>
                      <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        {detailsOrder.customerAddress}
                        {detailsOrder.customerCity && `, ${detailsOrder.customerCity}`}
                        {detailsOrder.customerPostalCode && ` ${detailsOrder.customerPostalCode}`}
                        {detailsOrder.customerCountry && `, ${detailsOrder.customerCountry}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Status</p>
                    <Badge className={`${getStatusColor(detailsOrder.status)} flex items-center gap-1 w-fit font-medium text-base px-3 py-1`}>
                      {getStatusIcon(detailsOrder.status)}
                      {detailsOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Amount</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{detailsOrder.total.toFixed(2)} SEK</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Payment Method</p>
                    <p className="text-lg font-semibold text-green-900 dark:text-green-100 capitalize">{detailsOrder.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Products and Designs Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Products & Designs ({detailsOrder.items.length} items)
                </h3>
                
                {detailsOrder.items.map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {/* Product Header */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 border-b border-slate-200 dark:border-slate-600">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20 flex-shrink-0">
                          <Image 
                              src={(item as any).designPreview || (item as any).designContext?.selectedVariation?.variationImages?.find((img: any) => img.angle === ((item as any).designContext?.viewMode || 'front'))?.url || '/placeholder.svg'} 
                              alt={item.name} 
                            fill 
                              className="object-cover rounded-lg border border-slate-200 dark:border-slate-600" 
                          />
                            {(item as any).designPreview && (
                              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              ✨
                            </div>
                          )}
                        </div>
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {item.name}
                              {(item as any).designContext?.selectedVariation && (
                                <span className="ml-2 text-sm font-normal text-slate-600 dark:text-slate-400">
                                  ({(item as any).designContext.selectedVariation.colorName})
                              </span>
                              )}
                            </h4>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              Quantity: {item.quantity} • Price: {typeof item.price === 'number' ? item.price.toFixed(2) : item.price} SEK
                            </div>
                          {(item as any).selectedSizes && (item as any).selectedSizes.length > 0 && (
                              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Sizes: {(item as any).selectedSizes.map((s: any) => `${s.size} × ${s.quantity}`).join(', ')}
                            </div>
                          )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {typeof item.price === 'number' ? (item.price * item.quantity).toFixed(2) : 'N/A'} SEK
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Total</div>
                        </div>
                      </div>
                    </div>

                    {/* Design Details */}
                          {(item as any).designContext && (
                      <div className="p-4 space-y-4">
                        <h5 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Design Details
                              </h5>
                        
                        {/* View Mode and Color */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">View Mode</p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 capitalize">
                              {(item as any).designContext.viewMode}
                            </p>
                                </div>
                          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Color</p>
                                  <div className="flex items-center gap-2">
                                    <div 
                                className="w-6 h-6 rounded-full border border-slate-300"
                                style={{ backgroundColor: (item as any).designContext.productColor }}
                                    />
                              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {(item as any).designContext.productColor}
                                    </span>
                                  </div>
                                </div>
                        </div>

                        {/* Template Information */}
                                {(item as any).designContext.selectedTemplate && (
                          <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                            <h6 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Applied Template</h6>
                            <div className="flex items-center gap-3">
                              <div className="relative w-16 h-16">
                                <Image 
                                  src={(item as any).designContext.selectedTemplate.image} 
                                  alt={(item as any).designContext.selectedTemplate.name} 
                                  fill 
                                  className="object-cover rounded border border-purple-200 dark:border-purple-800" 
                                />
                              </div>
                              <div>
                                <p className="font-medium text-purple-900 dark:text-purple-100">
                                      {(item as any).designContext.selectedTemplate.name}
                                </p>
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                  Category: {(item as any).designContext.selectedTemplate.category}
                                </p>
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                  Price: {(item as any).designContext.selectedTemplate.price === 'free' ? 'Free' : `${(item as any).designContext.selectedTemplate.price} SEK`}
                                </p>
                              </div>
                            </div>
                                  </div>
                                )}

                        {/* Variation Details */}
                        {(item as any).designContext.selectedVariation && (
                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                            <h6 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">Variation Details</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Color Name</p>
                                <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                                  {(item as any).designContext.selectedVariation.colorName}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Color Code</p>
                                  <div className="flex items-center gap-2">
                                  <div 
                                    className="w-6 h-6 rounded-full border border-orange-300"
                                    style={{ backgroundColor: (item as any).designContext.selectedVariation.colorHexCode }}
                                  />
                                  <span className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                                    {(item as any).designContext.selectedVariation.colorHexCode}
                                    </span>
                                  </div>
                              </div>
                            </div>
                            
                            {/* All Available Angles with Designs */}
                            {(item as any).designContext.selectedVariation.variationImages && (item as any).designContext.selectedVariation.variationImages.length > 0 && (
                              <div className="mt-4">
                                <h6 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">All Product Angles with Applied Designs</h6>
                                
                                {/* Check if we have all designed angles data */}
                                {(item as any).designContext.allDesignedAngles ? (
                                  // Show all designed angles with their rendered designs
                                  <div className="space-y-6">
                                    {(item as any).designContext.allDesignedAngles.map((designedAngle: any, angleIdx: number) => {
                                      const angleImage = (item as any).designContext.selectedVariation.variationImages.find((img: any) => img.angle === designedAngle.angle)
                                      const isCurrentView = designedAngle.angle === (item as any).designContext.viewMode
                                      const hasDesign = designedAngle.hasDesign
                                      const hasCanvasData = !!designedAngle.canvasJSON
                                      
                                      return (
                                        <div key={angleIdx} className="bg-white dark:bg-slate-700/30 rounded-lg border-2 overflow-hidden ${
                                          isCurrentView 
                                            ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-200' 
                                            : hasDesign
                                            ? 'border-green-500 bg-green-50/30'
                                            : 'border-orange-200 bg-white'
                                        }">
                                          {/* Angle Header */}
                                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-3 border-b border-orange-200 dark:border-orange-700">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-3">
                                                <h6 className="font-semibold text-orange-900 dark:text-orange-100 capitalize text-lg">
                                                  {designedAngle.angle} View
                                                </h6>
                                                {isCurrentView && (
                                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                                                    Current Design
                                                  </Badge>
                                                )}
                                                {hasDesign && !isCurrentView && (
                                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-300">
                                                    Design Applied
                                                  </Badge>
                                                )}
                                                {!hasDesign && (
                                                  <Badge variant="outline" className="text-xs text-gray-500">
                                                    No Design
                                                  </Badge>
                                )}
                              </div>
                                              
                                              {/* Design Status Indicators */}
                                              <div className="flex items-center gap-2 text-sm">
                                                {hasCanvasData && (
                                                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    Canvas Data
                            </div>
                          )}
                                                {hasDesign && (
                                                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    Design Elements
                                                  </div>
                                                )}
                                              </div>
                        </div>
                      </div>

                                          {/* Main Content Area */}
                                          <div className="p-4">
                                            <div className="flex flex-col lg:flex-row gap-6">
                                              {/* Left: Full-Size Product Image with Design */}
                                              <div className="flex-1">
                                                <div className="relative">
                                                  {/* Product Image with Design Overlay */}
                                                  <div className="relative w-full max-w-2xl mx-auto">
                                                    {angleImage ? (
                                                      <div className="relative">
                                                        {/* Base Product Image */}
                                    <Image 
                                                          src={angleImage.url} 
                                                          alt={`${designedAngle.angle} view with design`} 
                                                          width={800} 
                                                          height={600} 
                                                          className="w-full h-auto rounded-lg border-2 border-orange-200 dark:border-orange-700 shadow-lg" 
                                                        />
                                                        
                                                                                                                {/* Design Elements Overlay - This will be rendered by a separate component */}
                                                        {designedAngle.canvasJSON && designedAngle.canvasJSON.objects && designedAngle.canvasJSON.objects.length > 0 && (
                                                          <div className="absolute inset-0">
                                                            <DesignCanvasRenderer 
                                                              canvasJSON={designedAngle.canvasJSON}
                                                              productImage={angleImage.url}
                                                              angle={designedAngle.angle}
                                                            />
                                                          </div>
                                                        )}
                                        
                                        {/* Design Elements Status Indicator */}
                                        {designedAngle.canvasJSON && designedAngle.canvasJSON.objects && designedAngle.canvasJSON.objects.length > 0 && (
                                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                                            ✓ {designedAngle.canvasJSON.objects.length} Design Elements
                                          </div>
                                        )}
                                                        
                                                        {/* Design Status Overlay */}
                                                        {hasDesign && (
                                                          <div className="absolute top-2 left-2">
                                                            <div className={`text-white text-xs px-3 py-1 rounded-full font-medium ${
                                                              isCurrentView ? 'bg-orange-600' : 'bg-green-600'
                                                            }`}>
                                                              {isCurrentView ? '✓ Current Design' : '✓ Design Applied'}
                                                            </div>
                                                          </div>
                                                        )}
                                                        
                                                        {/* Angle Label */}
                                                        <div className="absolute bottom-2 left-2 bg-orange-600 text-white text-sm px-3 py-1 rounded capitalize font-medium">
                                                          {designedAngle.angle}
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div className="w-full h-64 bg-gray-100 dark:bg-gray-600 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-500">
                                                        <div className="text-center text-gray-500 dark:text-gray-400">
                                                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                          <p>No image available for {designedAngle.angle} view</p>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                          </div>
                                        </div>
                                        
                                              {/* Right: Design Information */}
                                              <div className="lg:w-80 space-y-4">
                                                {/* Design Status Summary */}
                                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                                                  <h6 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Design Status</h6>
                                                  <div className="space-y-2 text-sm">
                                                    <div className="flex items-center justify-between">
                                                      <span className="text-slate-600 dark:text-slate-400">Has Design:</span>
                                                      <span className={`font-medium ${hasDesign ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {hasDesign ? 'Yes' : 'No'}
                                                  </span>
                                                </div>
                                                    <div className="flex items-center justify-between">
                                                      <span className="text-slate-600 dark:text-slate-400">Canvas Data:</span>
                                                      <span className={`font-medium ${hasCanvasData ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {hasCanvasData ? 'Available' : 'Missing'}
                                                  </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                      <span className="text-slate-600 dark:text-slate-400">View Type:</span>
                                                      <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {isCurrentView ? 'Primary Design' : 'Shared Design'}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                {/* Design Elements Summary */}
                                                {designedAngle.canvasJSON && designedAngle.canvasJSON.objects && designedAngle.canvasJSON.objects.length > 0 && (
                                                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                                                    <h6 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Design Elements</h6>
                                                    <DesignElementsSummary canvasJSON={designedAngle.canvasJSON} />
                                                </div>
                                                )}
                                                
                                                {/* Production Notes */}
                                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                                                  <h6 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Production Notes</h6>
                                                  <div className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                                                    {hasDesign && designedAngle.canvasJSON?.objects && designedAngle.canvasJSON.objects.length > 0 ? (
                                                      <>
                                                        <div>✓ Design elements ready for production</div>
                                                        <div>✓ Canvas specifications available</div>
                                                        <div>✓ Positioning and sizing preserved</div>
                                                        {isCurrentView && (
                                                          <div className="font-medium">• This is the primary design view</div>
                                                        )}
                                                      </>
                                                    ) : (
                                                      <>
                                                        <div>⚠️ No design elements for this view</div>
                                                        <div>⚠️ Production may require manual setup</div>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  // Fallback to old display method
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {(item as any).designContext.selectedVariation.variationImages.map((img: any, imgIdx: number) => (
                                      <div key={imgIdx} className="relative">
                                        <div className={`w-full aspect-square rounded-lg border-2 overflow-hidden ${
                                          img.angle === (item as any).designContext.viewMode 
                                            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                                            : 'border-orange-200 bg-white'
                                        }`}>
                                          <Image 
                                            src={img.url} 
                                            alt={`${img.angle} view`} 
                                            width={120} 
                                            height={120} 
                                            className="object-cover w-full h-full" 
                                          />
                                          {/* Design Elements Overlay */}
                                          {(item as any).designCanvasJSON && (
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                              <div className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                                Design Applied
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white text-xs px-2 py-1 rounded capitalize">
                                          {img.angle}
                                    </div>
                                        {/* Current View Indicator */}
                                        {img.angle === (item as any).designContext.viewMode && (
                                          <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                            ✓
                                  </div>
                                        )}
                                </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="mt-3 text-sm text-orange-700 dark:text-orange-300">
                                  <span className="font-medium">Current Design View:</span> {(item as any).designContext.viewMode} 
                                  {item.designCanvasJSON && (
                                    <span className="ml-2 text-green-600">• Design elements applied</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Design Preview */}
                        {(item as any).designPreview && (
                          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <h6 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Final Design Preview</h6>
                            <div className="relative w-full max-w-md mx-auto">
                              <Image 
                                src={(item as any).designPreview} 
                                alt="Design Preview" 
                                width={400} 
                                height={300} 
                                className="w-full h-auto rounded-lg border border-blue-200 dark:border-blue-800" 
                              />
                              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                Final Design
                              </div>
                            </div>
                          </div>
                        )}

                 
                    </div>
                    )}

                    {/* No Design Context Warning */}
                    {!(item as any).designContext && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">No Design Context Available</span>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          This item was added without design customization. Design data may not be available for production.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button 
                  variant="outline" 
                  onClick={() => setDetailsOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => handleExportPrintFile(detailsOrder.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileArchive className="mr-2 h-4 w-4" />
                  Export Print File (PDF)
                </Button>
            </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
