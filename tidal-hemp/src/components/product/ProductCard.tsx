"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import { useAccess } from "@/context/AccessContext";
import { useCart } from "@/context/CartContext";
import { defaultVariant, isAvailable } from "@/lib/catalog";
import { cx, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Badge, Price, VariantSelector } from "@/components/ui/primitives";

export function ProductCard({
  product,
  priority,
  showDescription = true,
}: {
  product: Product;
  priority?: boolean;
  showDescription?: boolean;
}) {
  const { add } = useCart();
  const { isSaved, toggleSaved, hydrated } = useAccess();
  const [variantId, setVariantId] = useState(defaultVariant(product).id);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const available = isAvailable(product) && variant.availability !== "sold-out";
  const saved = hydrated && isSaved(product.id);
  const href = `/shop/${product.slug}`;
  const [primary, secondary] = product.images;

  return (
    <article className="group/card relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-shell">
        <Link href={href} aria-label={`${product.name}, ${product.subtitle}`} className="absolute inset-0">
          <Image
            src={primary.src}
            alt={primary.alt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-tide)] group-hover/card:scale-[1.045]"
          />
          {secondary && (
            <Image
              src={secondary.src}
              alt=""
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="hidden object-cover opacity-0 transition-[opacity,scale] duration-[900ms] ease-[var(--ease-tide)] group-hover/card:scale-[1.03] group-hover/card:opacity-100 md:block"
            />
          )}
        </Link>

        {product.badges.length > 0 && (
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.badges.slice(0, 2).map((b) => (
              <Badge key={b} label={b} tone={b === "Members" ? "dark" : "light"} />
            ))}
          </div>
        )}
        {!isAvailable(product) && (
          <div className="pointer-events-none absolute left-3 top-3">
            <Badge label="Sold out" tone="dark" />
          </div>
        )}

        <button
          type="button"
          onClick={() => toggleSaved(product.id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full text-ink/70 transition-[background-color,opacity] duration-300 hover:bg-ivory/80 hover:text-ink md:opacity-0 md:group-hover/card:opacity-100 md:focus-visible:opacity-100 data-[saved=true]:opacity-100"
          data-saved={saved}
        >
          <Heart className={cx("size-[17px]", saved && "fill-ink text-ink")} strokeWidth={1.4} />
        </button>

        {/* Desktop hover actions */}
        <div className="absolute inset-x-3 bottom-3 hidden translate-y-2 gap-2 opacity-0 transition-[opacity,translate] duration-500 ease-[var(--ease-tide)] group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100 md:flex">
          <Link
            href={href}
            className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-ivory/95 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink backdrop-blur transition-colors hover:bg-white"
          >
            View product
          </Link>
          <button
            type="button"
            disabled={!available}
            onClick={() => add(product.id, variant.id)}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-ink text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-ocean disabled:bg-ink/50"
          >
            {available ? (
              <>
                Add <span className="text-ivory/50">·</span> {variant.label}
              </>
            ) : (
              "Sold out"
            )}
          </button>
        </div>

        {/* Mobile quick add */}
        <button
          type="button"
          disabled={!available}
          onClick={() => add(product.id, variant.id)}
          aria-label={`Add ${product.name} ${variant.label} to cart`}
          className="absolute bottom-2.5 right-2.5 grid size-10 place-items-center rounded-full bg-ivory/95 text-ink shadow-[var(--shadow-soft)] backdrop-blur active:scale-95 disabled:opacity-40 md:hidden"
        >
          <Plus className="size-[18px]" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4 md:pt-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-mist">{product.category}</p>
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h3 className="text-[12px] font-semibold uppercase leading-snug tracking-[0.2em] md:text-[13px]">
            <Link href={href} className="link-draw pb-0.5">
              {product.name}
            </Link>
          </h3>
          <Price value={variant.price} className="hidden shrink-0 text-[13px] md:inline" />
        </div>
        <p className="mt-1 text-[13px] text-mist">{product.subtitle}</p>
        {showDescription && (
          <p className="mt-3 line-clamp-2 hidden text-[13px] leading-relaxed text-ink/70 md:block">{product.shortDescription}</p>
        )}
        <p className="mt-2 text-[13px] tabular-nums md:hidden">{formatPrice(variant.price)}</p>
        {product.variants.length > 1 && (
          <div className="mt-4 hidden md:block">
            <VariantSelector
              size="sm"
              variants={product.variants}
              value={variantId}
              onChange={setVariantId}
              label={`${product.name} size`}
            />
          </div>
        )}
      </div>
    </article>
  );
}
