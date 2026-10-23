"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, FlaskConical, Heart, Lock, ShieldCheck } from "lucide-react";
import { faqs, legalPages } from "@/data/content";
import { useAccess } from "@/context/AccessContext";
import { useCart } from "@/context/CartContext";
import { defaultVariant } from "@/lib/catalog";
import { cx, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Badge, Price, QuantitySelector, Stars, VariantSelector } from "@/components/ui/primitives";
import { LabResults } from "./LabResults";

const assurances = [
  { icon: Lock, label: "Secure checkout" },
  { icon: ShieldCheck, label: "Age verification" },
  { icon: FlaskConical, label: "Batch tested" },
  { icon: FileText, label: "COA available" },
];

export function PurchasePanel({ product }: { product: Product }) {
  const { add } = useCart();
  const { isSaved, toggleSaved, hydrated } = useAccess();
  const [variantId, setVariantId] = useState(defaultVariant(product).id);
  const [qty, setQty] = useState(1);
  const [showSticky, setShowSticky] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const soldOut = variant.availability === "sold-out";
  const saved = hydrated && isSaved(product.id);
  const addToCart = () => add(product.id, variant.id, qty);

  // Mobile sticky bar appears once the main button scrolls out of view.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const productFaqs = [...faqs[0].items.slice(0, 2), ...faqs[2].items.slice(0, 2)];

  return (
    <div>
      {product.badges.length > 0 && (
        <div className="mb-5 flex gap-1.5">
          {product.badges.map((b) => (
            <Badge key={b} label={b} tone={b === "Members" ? "dark" : "light"} />
          ))}
        </div>
      )}
      <p className="eyebrow text-mist">{product.category} · {product.type}</p>
      <h1 className="mt-3 text-xl font-semibold uppercase tracking-[0.22em] md:text-2xl">{product.name}</h1>
      <p className="display mt-2 text-2xl italic text-ink/80 md:text-[1.75rem]">{product.subtitle}</p>

      <a href="#reviews" className="mt-4 inline-block">
        <Stars rating={product.rating} count={product.reviewCount} />
      </a>

      <p className="mt-6 text-xl tabular-nums">
        <Price value={variant.price} compareAt={variant.compareAtPrice} />
      </p>

      <p className="mt-5 text-[15px] leading-relaxed text-ink/75">{product.shortDescription}</p>

      <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] uppercase tracking-[0.16em] text-mist" aria-label="Experience notes">
        {product.notes.map((n, i) => (
          <li key={n} className="flex items-center gap-4">
            {i > 0 && <span aria-hidden className="size-[3px] rounded-full bg-mist/60" />}
            {n}
          </li>
        ))}
      </ul>

      <div className="mt-8 border-t border-line pt-7">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="eyebrow" id="size-label">
            {product.variants.length > 1 ? "Select size" : "Size"}
          </p>
          <p className="text-[12px] text-mist">
            {variant.availability === "low-stock" ? "Only a few left" : soldOut ? "Sold out" : "In stock · Ships today"}
          </p>
        </div>
        <VariantSelector variants={product.variants} value={variantId} onChange={setVariantId} />
      </div>

      <div ref={ctaRef} className="mt-6 flex gap-3">
        <QuantitySelector value={qty} onChange={setQty} />
        <Button size="lg" className="flex-1" disabled={soldOut} onClick={addToCart}>
          {soldOut ? "Sold out" : <>Add to cart <span className="text-ivory/40">—</span> {formatPrice(variant.price * qty)}</>}
        </Button>
        <button
          type="button"
          onClick={() => toggleSaved(product.id)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save product"}
          className="grid size-14 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-line-strong transition-colors hover:border-ink"
        >
          <Heart className={cx("size-[18px]", saved && "fill-ink")} strokeWidth={1.4} />
        </button>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] border border-line bg-line">
        {assurances.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3 bg-ivory px-4 py-3.5 text-[12px] text-ink/80">
            <Icon className="size-4 shrink-0 text-ocean" strokeWidth={1.4} aria-hidden />
            {label}
          </li>
        ))}
      </ul>

      <Accordion
        className="mt-10"
        defaultOpen={["lab"]}
        items={[
          {
            id: "details",
            title: "Product details",
            content: (
              <div className="space-y-4">
                {product.description.map((d) => (
                  <p key={d.slice(0, 20)}>{d}</p>
                ))}
                <dl className="mt-2 divide-y divide-line border-y border-line">
                  {product.details.map((d) => (
                    <div key={d.label} className="grid grid-cols-[9rem_1fr] gap-4 py-2.5 text-[13px]">
                      <dt className="text-mist">{d.label}</dt>
                      <dd>{d.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ),
          },
          { id: "lab", title: "Lab results", content: <LabResults batch={product.batch} /> },
          { id: "ingredients", title: "Ingredients", content: <p>{product.ingredients}</p> },
          {
            id: "shipping",
            title: "Shipping",
            content: (
              <div className="space-y-3">
                {legalPages.shipping.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            ),
          },
          {
            id: "returns",
            title: "Returns",
            content: (
              <div className="space-y-3">
                {legalPages.returns.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            ),
          },
          {
            id: "faq",
            title: "FAQ",
            content: (
              <dl className="space-y-5">
                {productFaqs.map((f) => (
                  <div key={f.q}>
                    <dt className="font-semibold text-ink">{f.q}</dt>
                    <dd className="mt-1.5">{f.a}</dd>
                  </div>
                ))}
              </dl>
            ),
          },
        ]}
      />

      <p id="reviews" className="mt-8 text-[12px] leading-relaxed text-mist">
        {product.rating.toFixed(1)} average from {product.reviewCount} verified customers. For adults 21+. Contains less than
        0.3% Δ9-THC by dry weight.
      </p>

      {/* Mobile sticky add-to-cart */}
      <div
        className={cx(
          "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-500 ease-[var(--ease-tide)] md:hidden",
          showSticky ? "translate-y-0" : "translate-y-full"
        )}
        aria-hidden={!showSticky}
        inert={!showSticky}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="eyebrow truncate">{product.name}</p>
            <p className="mt-0.5 text-[13px] text-mist">
              {variant.label} · {formatPrice(variant.price)}
            </p>
          </div>
          <Button disabled={soldOut} onClick={addToCart} className="shrink-0">
            {soldOut ? "Sold out" : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
