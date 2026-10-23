/**
 * Commerce domain types.
 *
 * These mirror the shape most headless ecommerce backends return
 * (Shopify Storefront, Medusa, Saleor, BigCommerce), so swapping the
 * placeholder catalog for a real API only touches `src/lib/catalog.ts`.
 */

export type ProductCategory = "Flower" | "Vapes" | "Edibles" | "Pre-Rolls" | "Oils" | "Topicals";

export type ProductBadge = "New" | "Best Seller" | "Limited" | "Members";

export type Availability = "in-stock" | "low-stock" | "sold-out";

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductVariant {
  id: string;
  /** Short label shown in selectors, e.g. "3.5g" */
  label: string;
  price: number;
  compareAtPrice?: number;
  availability: Availability;
}

export interface Cannabinoid {
  name: string;
  /** Percentage by weight, or mg per unit for edibles/oils */
  value: number;
  unit: "%" | "mg";
}

export interface BatchInfo {
  id: string;
  testedOn: string; // ISO date
  lab: string;
  cannabinoids: Cannabinoid[];
  /** Panels that were run and passed */
  panels: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Short line under the name, e.g. "Premium THCA Flower" */
  subtitle: string;
  category: ProductCategory;
  /** Finer-grained type used by filters, e.g. "Indoor", "Disposable" */
  type: string;
  shortDescription: string;
  description: string[];
  details: { label: string; value: string }[];
  ingredients: string;
  images: ProductImage[];
  variants: ProductVariant[];
  /** Variant pre-selected on cards and product pages. Defaults to the first in stock. */
  defaultVariantId?: string;
  badges: ProductBadge[];
  rating: number;
  reviewCount: number;
  /** Lower = sells more. Used for "Best selling" sort. */
  salesRank: number;
  releasedOn: string; // ISO date
  /** Only visible to signed-in, verified customers. */
  isPrivate: boolean;
  featured: boolean;
  batch: BatchInfo;
  /** Effect / experience notes — kept neutral and non-medical. */
  notes: string[];
}

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface Order {
  id: string;
  placedOn: string;
  status: "Processing" | "Shipped" | "Delivered";
  tracking?: { carrier: string; number: string; url: string };
  lines: { productId: string; variantId: string; quantity: number; price: number }[];
  total: number;
}

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  memberSince: string;
  tier: string;
  shippingAddress: string[];
}
