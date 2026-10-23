"use client";

import { useEffect, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { categories, sortOptions, type SortKey } from "@/lib/catalog";
import { cx } from "@/lib/format";
import type { ProductCategory } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { CloseButton, Overlay } from "@/components/ui/Overlay";

export type PriceBand = "under-30" | "30-60" | "over-60";

export interface FilterState {
  category: ProductCategory | "All";
  types: string[];
  price: PriceBand[];
  inStock: boolean;
  sort: SortKey;
}

export const priceBands: { value: PriceBand; label: string; test: (n: number) => boolean }[] = [
  { value: "under-30", label: "Under $30", test: (n) => n < 30 },
  { value: "30-60", label: "$30 – $60", test: (n) => n >= 30 && n <= 60 },
  { value: "over-60", label: "Over $60", test: (n) => n > 60 },
];

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "h-10 rounded-[var(--radius-sm)] border px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
        active ? "border-ink bg-ink text-ivory" : "border-line-strong hover:border-ink"
      )}
    >
      {children}
    </button>
  );
}

export function ProductFilters({
  state,
  onChange,
  typeOptions,
  resultCount,
  categoryCounts,
}: {
  state: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  typeOptions: string[];
  resultCount: number;
  categoryCounts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const desktop = useIsDesktop();
  const activeCount = state.types.length + state.price.length + (state.inStock ? 1 : 0);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <>
      <div className="sticky top-14 z-30 -mx-5 border-b border-line bg-ivory/90 px-5 backdrop-blur-xl md:top-16 md:mx-0 md:px-0">
        <div className="flex items-center gap-4">
          {/* Category tabs */}
          <nav aria-label="Categories" className="no-scrollbar -mb-px flex flex-1 gap-6 overflow-x-auto md:gap-9">
            {(["All", ...categories] as const).map((c) => {
              const active = state.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ category: c, types: [] })}
                  className={cx(
                    "relative h-14 shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors",
                    active ? "text-ink" : "text-ink/45 hover:text-ink"
                  )}
                >
                  {c}
                  <span className="ml-1.5 align-super text-[9px] text-mist">{categoryCounts[c] ?? 0}</span>
                  <span
                    className={cx(
                      "absolute inset-x-0 bottom-0 h-px origin-left bg-ink transition-transform duration-500 ease-[var(--ease-tide)]",
                      active ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </button>
              );
            })}
          </nav>

          <div className="hidden items-center gap-6 md:flex">
            <label className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
              <span className="text-mist">Sort</span>
              <select
                value={state.sort}
                onChange={(e) => onChange({ sort: e.target.value as SortKey })}
                className="cursor-pointer appearance-none bg-transparent pr-5 uppercase tracking-[0.18em] focus:outline-none"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 size-3.5" strokeWidth={1.5} />
            </label>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Filter and sort${activeCount ? `, ${activeCount} active` : ""}`}
            className="flex h-10 shrink-0 items-center gap-2 border-l border-line pl-4 text-[11px] font-semibold uppercase tracking-[0.18em] md:border-l-0 md:pl-0"
          >
            <SlidersHorizontal className="size-4" strokeWidth={1.4} />
            <span className="hidden sm:inline">Filter</span>
            {activeCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-ink text-[9.5px] text-ivory">{activeCount}</span>
            )}
          </button>
        </div>
      </div>

      <Overlay open={open} onClose={() => setOpen(false)} label="Filter and sort" side={desktop ? "right" : "bottom"}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 md:h-20 md:px-7">
          <h2 className="eyebrow !text-xs">Filter &amp; Sort</h2>
          <CloseButton onClick={() => setOpen(false)} label="Close filters" className="-mr-2" />
        </div>

        <div className="flex-1 space-y-9 overflow-y-auto px-5 py-7 md:px-7">
          <fieldset className="md:hidden">
            <legend className="eyebrow mb-4 text-mist">Sort by</legend>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((o) => (
                <Chip key={o.value} active={state.sort === o.value} onClick={() => onChange({ sort: o.value })}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-4 text-mist">Category</legend>
            <div className="flex flex-wrap gap-2">
              {(["All", ...categories] as const).map((c) => (
                <Chip key={c} active={state.category === c} onClick={() => onChange({ category: c, types: [] })}>
                  {c}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-4 text-mist">Product type</legend>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((t) => (
                <Chip key={t} active={state.types.includes(t)} onClick={() => onChange({ types: toggle(state.types, t) })}>
                  {t}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-4 text-mist">Price</legend>
            <div className="flex flex-wrap gap-2">
              {priceBands.map((b) => (
                <Chip key={b.value} active={state.price.includes(b.value)} onClick={() => onChange({ price: toggle(state.price, b.value) })}>
                  {b.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-4 text-mist">Availability</legend>
            <label className="flex cursor-pointer items-center justify-between rounded-[var(--radius-sm)] border border-line-strong px-4 py-3.5">
              <span className="text-sm">In stock only</span>
              <input
                type="checkbox"
                checked={state.inStock}
                onChange={(e) => onChange({ inStock: e.target.checked })}
                className="peer sr-only"
              />
              <span className="relative h-6 w-11 rounded-full bg-ink/15 transition-colors peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-ivory after:shadow after:transition-transform peer-checked:after:translate-x-5" />
            </label>
          </fieldset>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:px-7">
          <Button variant="outline" onClick={() => onChange({ category: "All", types: [], price: [], inStock: false, sort: "featured" })}>
            Clear all
          </Button>
          <Button onClick={() => setOpen(false)}>Show {resultCount}</Button>
        </div>
      </Overlay>
    </>
  );
}
