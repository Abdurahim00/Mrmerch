import { ProductsView } from "@/components/products/ProductsView"

export default function CategoryProductsPage({ params }: { params: { category: string } }) {
  return <ProductsView categorySlug={params.category} />
}


