import Link from "next/link";
import { cx } from "@/lib/format";

type Variant = "solid" | "outline" | "light" | "outline-light" | "seafoam";
type Size = "md" | "lg" | "sm";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-[var(--radius-sm)] font-semibold uppercase tracking-[0.18em] transition-[background-color,color,border-color,transform] duration-300 ease-[var(--ease-tide)] active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  solid: "bg-ink text-ivory hover:bg-ocean",
  outline: "border border-ink/80 text-ink hover:bg-ink hover:text-ivory",
  light: "bg-ivory text-ink hover:bg-white",
  "outline-light": "border border-ivory/60 text-ivory hover:border-ivory hover:bg-ivory hover:text-ink",
  seafoam: "bg-seafoam text-ink hover:bg-[#9cbcb2]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[10px]",
  md: "h-12 px-7 text-[11px]",
  lg: "h-14 px-9 text-[11px]",
};

interface Common {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  full?: boolean;
}

export function Button({
  variant = "solid",
  size = "md",
  className,
  full,
  children,
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cx(base, variants[variant], sizes[size], full && "w-full", className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "solid",
  size = "md",
  className,
  full,
  children,
  href,
  ...props
}: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={cx(base, variants[variant], sizes[size], full && "w-full", className)} {...props}>
      {children}
    </Link>
  );
}

/** Uppercase text link with a drawn underline and arrow. */
export function TextLink({
  href,
  children,
  className,
  light,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "eyebrow group inline-flex items-center gap-2 pb-1",
        light ? "text-ivory" : "text-ink",
        className
      )}
    >
      <span className="link-draw pb-1">{children}</span>
      <span aria-hidden className="transition-transform duration-500 ease-[var(--ease-tide)] group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
