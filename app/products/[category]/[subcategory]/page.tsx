import { ProductsView } from "@/components/products/ProductsView"

export default function SubcategoryProductsPage({ params }: { params: { category: string; subcategory: string } }) {
  return <ProductsView categorySlug={params.category} subcategorySlug={params.subcategory} />
}


