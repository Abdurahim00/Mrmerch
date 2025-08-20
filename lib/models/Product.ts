import type { ObjectId } from "mongodb"

export interface VariationImage {
  id: string;
  url: string;
  alt_text: string;
  angle: string;
  is_primary: boolean;
}

export interface Color {
  name: string;
  hex_code: string;
  swatch_image?: string;
}

export interface SizePrice {
  size: string;
  price: number;
  inStock: boolean;
  stockQuantity: number;
  useBasePrice?: boolean; // If true, use product's base price
}

export interface Variation {
  id: string;
  color: Color;
  price: number; // Base price
  sizePrices?: SizePrice[]; // Size-specific pricing
  inStock: boolean;
  stockQuantity: number;
  images: VariationImage[];
}

export interface ProductDocument {
  _id?: ObjectId;
  name: string;
  price: number;
  image: string;
  categoryId: string;
  subcategoryIds?: string[];
  description?: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
  hasVariations?: boolean;
  variations?: Variation[];
  // If true, product is eligible for global/app coupons and will have discounts applied
  eligibleForCoupons?: boolean;
  type?: string; // Product type (e.g., 'stickers', 't-shirt', etc.)
  baseColor?: string; // Default/base color for the product
  angles?: string[]; // Available viewing angles (e.g., ['front', 'back', 'left', 'right'])
  colors?: string[]; // Available colors for non-variation products
  // Individual angle images for single products without variations
  frontImage?: string;
  backImage?: string;
  leftImage?: string;
  rightImage?: string;
  materialImage?: string;
  frontAltText?: string;
  backAltText?: string;
  leftAltText?: string;
  rightAltText?: string;
  materialAltText?: string;
  // Purchase limit settings
  purchaseLimit?: {
    enabled: boolean; // Whether purchase limits are enabled for this product
    maxQuantityPerOrder: number; // Maximum quantity per order
    message?: string; // Custom message to show when limit is exceeded
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
  subcategoryIds?: string[];
  description?: string;
  inStock: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  hasVariations?: boolean;
  variations?: Variation[];
  // Mirrors ProductDocument. If true, this product participates in coupon discounts
  eligibleForCoupons?: boolean;
  type?: string; // Product type (e.g., 'stickers', 't-shirt', etc.)
  baseColor?: string; // Default/base color for the product
  angles?: string[]; // Available viewing angles (e.g., ['front', 'back', 'left', 'right'])
  colors?: string[]; // Available colors for non-variation products
  // Individual angle images for single products without variations
  frontImage?: string;
  backImage?: string;
  leftImage?: string;
  rightImage?: string;
  materialImage?: string;
  frontAltText?: string;
  backAltText?: string;
  leftAltText?: string;
  rightAltText?: string;
  materialAltText?: string;
  // Purchase limit settings
  purchaseLimit?: {
    enabled: boolean; // Whether purchase limits are enabled for this product
    maxQuantityPerOrder: number; // Maximum quantity per order
    message?: string; // Custom message to show when limit is exceeded
  };
}
