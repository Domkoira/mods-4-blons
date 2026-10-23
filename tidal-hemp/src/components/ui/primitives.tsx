"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Star } from "lucide-react";
import { cx, formatPrice } from "@/lib/format";
import type { ProductBadge, ProductVariant } from "@/lib/types";

/** Quiet product badge. */
export function Badge({ label, tone = "light" }: { label: ProductBadge | string; tone?: "light" | "dark" }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center rounded-[3px] px-2 text-[9.5px] font-semibold uppercase tracking-[0.2em]",
        tone === "light" ? "bg-ivory/90 text-ink backdrop-blur-sm" : "bg-ink text-ivory"
      )}
    >
      {label}
    </span>
  );
}

export function Price({ value, compareAt, className }: { value: number; compareAt?: number; className?: string }) {
  return (
    <span className={cx("tabular-nums", className)}>
      {compareAt && compareAt > value && (
        <span className="mr-2 text-mist line-through decoration-1">{formatPrice(compareAt)}</span>
      )}
      {formatPrice(value)}
    </span>
  );
}

export function Stars({ rating, count, className }: { rating: number; count?: number; className?: string }) {
  return (
    <div className={cx("flex items-center gap-2", className)}>
      <div className="flex gap-0.5" role="img" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            aria-hidden
            className={cx("size-3.5", i < Math.round(rating) ? "fill-ink text-ink" : "text-ink/25")}
            strokeWidth={1.25}
          />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-mist">{rating.toFixed(1)} · {count} reviews</span>}
    </div>
  );
}

/** Size / variant chips. */
export function VariantSelector({
  variants,
  value,
  onChange,
  size = "md",
  label = "Select size",
}: {
  variants: ProductVariant[];
  value: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {variants.map((v) => {
        const active = v.id === value;
        const soldOut = v.availability === "sold-out";
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={soldOut}
            onClick={() => onChange(v.id)}
            className={cx(
              "relative rounded-[var(--radius-sm)] border font-semibold uppercase tracking-[0.12em] transition-colors duration-200",
              size === "sm" ? "h-8 min-w-11 px-2.5 text-[10px]" : "h-12 min-w-[4.5rem] px-4 text-[11px]",
              active ? "border-ink bg-ink text-ivory" : "border-line-strong bg-transparent text-ink hover:border-ink",
              soldOut && "border-line text-ink/30 line-through hover:border-line"
            )}
          >
            {v.label}
            {soldOut && <span className="sr-only"> (sold out)</span>}
          </button>
        );
      })}
    </div>
  );
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 10,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const h = size === "sm" ? "h-9" : "h-12";
  return (
    <div className={cx("inline-flex items-center rounded-[var(--radius-sm)] border border-line-strong", h)}>
      <button
        type="button"
        aria-label={`Decrease ${label.toLowerCase()}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cx("grid h-full place-items-center text-ink/70 hover:text-ink", size === "sm" ? "w-8" : "w-11")}
      >
        <Minus className="size-3.5" strokeWidth={1.5} />
      </button>
      <span aria-live="polite" aria-label={label} className={cx("text-center text-sm tabular-nums", size === "sm" ? "w-6" : "w-8")}>
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label.toLowerCase()}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cx("grid h-full place-items-center text-ink/70 hover:text-ink", size === "sm" ? "w-8" : "w-11")}
      >
        <Plus className="size-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

/** Fades content up when it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-visible={visible}
      className={cx("reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  light,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={cx(align === "center" && "mx-auto text-center", "max-w-2xl", className)}>
      {eyebrow && <p className={cx("eyebrow mb-4", light ? "text-seafoam" : "text-ocean/70")}>{eyebrow}</p>}
      <h2 className={cx("eyebrow !text-[13px] !tracking-[0.28em] md:!text-sm", light ? "text-ivory" : "text-ink")}>{title}</h2>
      {subtitle && (
        <p className={cx("mt-4 text-[15px] leading-relaxed", light ? "text-ivory/70" : "text-mist")}>{subtitle}</p>
      )}
    </div>
  );
}
