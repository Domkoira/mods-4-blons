import { products } from "@/data/products";
import type { Product, ProductCategory, ProductVariant } from "@/lib/types";

/**
 * Catalog access layer.
 *
 * Every page and component reads products through these functions. They are
 * async on purpose: to connect Shopify / Medusa / a custom API, replace the
 * bodies with fetch calls and keep the signatures.
 */

export type SortKey = "featured" | "newest" | "best-selling" | "price-asc" | "price-desc";

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best selling" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
];

export const categories: ProductCategory[] = ["Flower", "Vapes", "Edibles", "Pre-Rolls", "Oils", "Topicals"];

export interface ProductQuery {
  includePrivate?: boolean;
}

export async function getProducts({ includePrivate = false }: ProductQuery = {}): Promise<Product[]> {
  return products.filter((p) => includePrivate || !p.isPrivate);
}

export async function getAllProducts(): Promise<Product[]> {
  return products;
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return products.filter((p) => p.featured && !p.isPrivate).slice(0, limit);
}

export async function getPrivateProducts(): Promise<Product[]> {
  return products.filter((p) => p.isPrivate);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return products.find((p) => p.slug === slug);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const pool = products.filter((p) => p.id !== product.id && !p.isPrivate);
  const same = pool.filter((p) => p.category === product.category);
  const rest = pool.filter((p) => p.category !== product.category).sort((a, b) => a.salesRank - b.salesRank);
  return [...same, ...rest].slice(0, limit);
}

// ---------- pure helpers (safe on client and server) ----------

export function lowestPrice(p: Product): number {
  return Math.min(...p.variants.map((v) => v.price));
}

export function defaultVariant(p: Product): ProductVariant {
  const preferred = p.variants.find((v) => v.id === p.defaultVariantId && v.availability !== "sold-out");
  return preferred ?? p.variants.find((v) => v.availability !== "sold-out") ?? p.variants[0];
}

export function isAvailable(p: Product): boolean {
  return p.variants.some((v) => v.availability !== "sold-out");
}

export function findVariant(productId: string, variantId: string) {
  const product = products.find((p) => p.id === productId);
  const variant = product?.variants.find((v) => v.id === variantId);
  return product && variant ? { product, variant } : undefined;
}

export function productById(id: string) {
  return products.find((p) => p.id === id);
}

export function sortProducts(list: Product[], sort: SortKey): Product[] {
  const out = [...list];
  switch (sort) {
    case "newest":
      return out.sort((a, b) => b.releasedOn.localeCompare(a.releasedOn));
    case "best-selling":
      return out.sort((a, b) => a.salesRank - b.salesRank);
    case "price-asc":
      return out.sort((a, b) => lowestPrice(a) - lowestPrice(b));
    case "price-desc":
      return out.sort((a, b) => lowestPrice(b) - lowestPrice(a));
    default:
      return out.sort((a, b) => Number(b.featured) - Number(a.featured) || a.salesRank - b.salesRank);
  }
}

export function searchProducts(list: Product[], q: string): Product[] {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return list.filter((p) =>
    [p.name, p.subtitle, p.category, p.type, p.shortDescription, ...p.notes].join(" ").toLowerCase().includes(term)
  );
}
