"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cx } from "@/lib/format";
import type { ProductImage } from "@/lib/types";

/**
 * Desktop: large stacked images beside a thumbnail rail.
 * Mobile: full-bleed swipeable carousel with progress dots.
 */
export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div>
      {/* Mobile carousel */}
      <div className="relative -mx-5 md:hidden">
        <div
          ref={track}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-label={`${name} images`}
          role="region"
          tabIndex={0}
        >
          {images.map((img, i) => (
            <div key={img.src} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-shell">
              <Image src={img.src} alt={img.alt} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-hidden>
          {images.map((img, i) => (
            <span
              key={img.src}
              className={cx("h-[3px] rounded-full bg-ink transition-all duration-500", i === active ? "w-6 opacity-80" : "w-3 opacity-25")}
            />
          ))}
        </div>
      </div>

      {/* Desktop gallery */}
      <div className="hidden gap-4 md:grid md:grid-cols-[72px_1fr] lg:gap-5">
        <div className="sticky top-28 flex h-fit flex-col gap-3">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === active}
              onClick={() => {
                setActive(i);
                refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className={cx(
                "relative aspect-[4/5] overflow-hidden rounded-[var(--radius-sm)] bg-shell ring-offset-2 ring-offset-ivory transition-[opacity,box-shadow]",
                i === active ? "opacity-100 ring-1 ring-ink" : "opacity-55 hover:opacity-90"
              )}
            >
              <Image src={img.src} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-4 lg:gap-5">
          {images.map((img, i) => (
            <div
              key={img.src}
              ref={(el) => {
                refs.current[i] = el;
              }}
              onMouseEnter={() => setActive(i)}
              className="group relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-shell"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 55vw, 60vw"
                className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-tide)] group-hover:scale-[1.03]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
