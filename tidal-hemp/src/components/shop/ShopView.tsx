"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useAccess } from "@/context/AccessContext";
import { categories, isAvailable, lowestPrice, sortOptions, sortProducts, type SortKey } from "@/lib/catalog";
import type { Product, ProductCategory } from "@/lib/types";
import { ProductFilters, priceBands, type FilterState, type PriceBand } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

/** Collection grid with URL-synced filters (shareable, back-button friendly). */
export function ShopView({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { customer, hydrated } = useAccess();

  const state: FilterState = useMemo(() => {
    const cat = params.get("category");
    const sort = params.get("sort") as SortKey | null;
    return {
      category: cat && (categories as string[]).includes(cat) ? (cat as ProductCategory) : "All",
      types: list(params.get("type")),
      price: list(params.get("price")) as PriceBand[],
      inStock: params.get("stock") === "1",
      sort: sort && sortOptions.some((o) => o.value === sort) ? sort : "featured",
    };
  }, [params]);

  const update = useCallback(
    (next: Partial<FilterState>) => {
      const s = { ...state, ...next };
      const q = new URLSearchParams();
      if (s.category !== "All") q.set("category", s.category);
      if (s.types.length) q.set("type", s.types.join(","));
      if (s.price.length) q.set("price", s.price.join(","));
      if (s.inStock) q.set("stock", "1");
      if (s.sort !== "featured") q.set("sort", s.sort);
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [state, router, pathname]
  );

  const visible = useMemo(
    () => products.filter((p) => !p.isPrivate || (hydrated && customer)),
    [products, customer, hydrated]
  );

  const inCategory = useMemo(
    () => (state.category === "All" ? visible : visible.filter((p) => p.category === state.category)),
    [visible, state.category]
  );

  const typeOptions = useMemo(() => Array.from(new Set(inCategory.map((p) => p.type))).sort(), [inCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: visible.length };
    for (const p of visible) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return counts;
  }, [visible]);

  const results = useMemo(() => {
    const filtered = inCategory.filter((p) => {
      if (state.types.length && !state.types.includes(p.type)) return false;
      if (state.inStock && !isAvailable(p)) return false;
      if (state.price.length) {
        const price = lowestPrice(p);
        if (!priceBands.some((b) => state.price.includes(b.value) && b.test(price))) return false;
      }
      return true;
    });
    return sortProducts(filtered, state.sort);
  }, [inCategory, state]);

  return (
    <>
      <ProductFilters
        state={state}
        onChange={update}
        typeOptions={typeOptions}
        resultCount={results.length}
        categoryCounts={categoryCounts}
      />

      <div className="flex items-center justify-between py-6 text-[12px] text-mist">
        <p aria-live="polite">
          {results.length} {results.length === 1 ? "product" : "products"}
        </p>
        {hydrated && !customer && (
          <p className="hidden md:block">
            Members see additional private releases.{" "}
            <Link href="/access" className="text-ink underline underline-offset-4">
              Request access
            </Link>
          </p>
        )}
      </div>

      {results.length ? (
        <ProductGrid products={results} priorityCount={4} key={JSON.stringify(state)} />
      ) : (
        <div className="flex flex-col items-center border-y border-line py-24 text-center">
          <p className="display text-4xl">Nothing matches — yet.</p>
          <p className="mt-3 text-sm text-mist">Try removing a filter. New batches arrive regularly.</p>
          <Button
            variant="outline"
            className="mt-8"
            onClick={() => update({ category: "All", types: [], price: [], inStock: false })}
          >
            Clear filters
          </Button>
        </div>
      )}
    </>
  );
}
