import { cx } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Reveal } from "@/components/ui/primitives";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  columns = 4,
  className,
  priorityCount = 0,
}: {
  products: Product[];
  columns?: 3 | 4;
  className?: string;
  priorityCount?: number;
}) {
  return (
    <ul
      className={cx(
        "grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 md:gap-y-14",
        columns === 4 && "xl:grid-cols-4",
        className
      )}
    >
      {products.map((p, i) => (
        <Reveal as="li" key={p.id} delay={(i % 4) * 70}>
          <ProductCard product={p} priority={i < priorityCount} />
        </Reveal>
      ))}
    </ul>
  );
}
