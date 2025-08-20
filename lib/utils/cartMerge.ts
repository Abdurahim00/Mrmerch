import type { CartItem } from "@/types"

// Keying rules to identify the "same" logical item across carts:
// - If a designId exists, key by designId (custom designs are unique by designId)
// - Else if a base productId exists and there is no design/context, key by productId for merging quantities
// - Otherwise, key by exact id only
const keyOf = (item: CartItem) => {
  if (item.designId) return `design:${item.designId}`
  const hasDesign = !!(item.designPreview || item.designContext || item.selectedSizes)
  if (!hasDesign && item.productId) return `productId:${item.productId}`
  return `id:${item.id}`
}

export function mergeCartsPreferRight(left: CartItem[], right: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>()
  for (const li of left) {
    map.set(keyOf(li), li)
  }
  for (const ri of right) {
    const k = keyOf(ri)
    const existing = map.get(k)
    if (!existing) {
      map.set(k, ri)
      continue
    }
    const merged: CartItem = {
      ...existing,
      ...ri,
      quantity: ri.quantity,
      selectedSizes: ri.selectedSizes ?? existing.selectedSizes,
    }
    map.set(k, merged)
  }
  return Array.from(map.values())
}


