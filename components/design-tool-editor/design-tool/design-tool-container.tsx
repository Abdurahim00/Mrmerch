"use client"

import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { LeftToolbar } from "./left-toolbar"
import { CentralCanvas } from "./cental-canvas"
import { RightPanel } from "./right-panel"
import { ProductModal } from "./modals/product-modal"
import { TemplateModal } from "./modals/template-modal"
import { setShowProductModal, setShowTemplateModal } from "@/lib/redux/designToolSlices/designSlice"
import { fetchProducts } from "@/lib/redux/slices/productsSlice"
import { RootState } from "@/lib/redux/store"
import { Button } from "@/components/ui/button"

export function DesignToolContainer() {
  const dispatch = useDispatch()
  const { showProductModal, showTemplateModal } = useSelector((state: RootState) => state.design)
  const { items: products, loading } = useSelector((state: RootState) => state.products)

  // Ensure products is always an array for backward compatibility
  const safeProducts = Array.isArray(products) ? products : []

  console.log('🛠️ [DesignToolContainer] Modal states:', { 
    showProductModal, 
    showTemplateModal, 
    productsCount: safeProducts.length, 
    loading,
    isArray: Array.isArray(products),
    productsType: typeof products
  })

  // Fetch regular products on mount for the product modal
  useEffect(() => {
    dispatch(fetchProducts() as any)
  }, [dispatch])

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <LeftToolbar />

        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
          <CentralCanvas />

          <div className="hidden xl:block flex-shrink-0">
            <RightPanel />
          </div>
        </div>
      </div>

      {/* Mobile and tablet right panel */}
      <div className="xl:hidden border-t border-gray-200 bg-white flex-shrink-0">
        <RightPanel isMobile={true} />
      </div>

      <ProductModal
        isOpen={showProductModal}
        onClose={() => dispatch(setShowProductModal(false))}
        products={safeProducts}
        loading={loading}
      />

      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => dispatch(setShowTemplateModal(false))}
      />

    </div>
  )
}
