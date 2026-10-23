import Link from "next/link";
import { cx } from "@/lib/format";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Tidal Hemp — home"
      className={cx(
        "inline-flex items-center whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.34em] md:text-sm",
        light ? "text-ivory" : "text-ink",
        className
      )}
    >
      Tidal<span className="mx-[0.45em] inline-block h-3 w-px translate-y-px bg-current opacity-35" aria-hidden />Hemp
    </Link>
  );
}
