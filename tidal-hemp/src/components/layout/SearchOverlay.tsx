"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { products } from "@/data/products";
import { useAccess } from "@/context/AccessContext";
import { categories, lowestPrice, searchProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { CloseButton, Overlay } from "@/components/ui/Overlay";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { customer } = useAccess();
  const [q, setQ] = useState("");
  const pool = useMemo(() => products.filter((p) => customer || !p.isPrivate), [customer]);
  const results = useMemo(() => searchProducts(pool, q).slice(0, 6), [pool, q]);

  return (
    <Overlay open={open} onClose={onClose} label="Search" side="top" className="max-h-[90dvh]">
      <div className="container-x py-5 md:py-8">
        <div className="flex items-center gap-3 border-b border-ink pb-3">
          <Search className="size-5 shrink-0 text-ink/60" strokeWidth={1.4} aria-hidden />
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <input
            id="site-search"
            data-autofocus
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the collection"
            autoComplete="off"
            className="display h-12 w-full bg-transparent text-3xl placeholder:text-ink/30 focus:outline-none md:text-4xl"
          />
          <CloseButton onClick={onClose} label="Close search" />
        </div>

        <div className="mt-6 overflow-y-auto pb-2" aria-live="polite">
          {!q && (
            <div>
              <p className="eyebrow text-mist">Browse</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link
                    key={c}
                    href={`/shop?category=${encodeURIComponent(c)}`}
                    onClick={onClose}
                    className="rounded-[var(--radius-sm)] border border-line-strong px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors hover:border-ink"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {q && results.length === 0 && <p className="text-sm text-mist">No products match “{q}”.</p>}
          {results.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/shop/${p.slug}`}
                    onClick={onClose}
                    className="group flex items-center gap-4 rounded-[var(--radius-md)] p-2 transition-colors hover:bg-shell"
                  >
                    <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-shell">
                      <Image src={p.images[0].src} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="eyebrow truncate">{p.name}</p>
                      <p className="mt-1 truncate text-sm text-mist">{p.subtitle}</p>
                      <p className="mt-1 text-sm tabular-nums">From {formatPrice(lowestPrice(p))}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Overlay>
  );
}
