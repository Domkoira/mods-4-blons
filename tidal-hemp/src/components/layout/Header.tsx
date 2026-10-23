"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { site } from "@/config/site";
import { useAccess } from "@/context/AccessContext";
import { useCart } from "@/context/CartContext";
import { cx } from "@/lib/format";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";

const iconBtn =
  "relative grid size-10 place-items-center rounded-full text-ink/80 transition-colors duration-300 hover:bg-ink/[0.04] hover:text-ink";

export function Header() {
  const pathname = usePathname();
  const { count, open: openCart } = useCart();
  const { customer, hydrated } = useAccess();
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const accountHref = customer ? "/account" : "/access?mode=signin";

  return (
    <>
      <header
        className={cx(
          "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-500 ease-[var(--ease-tide)]",
          compact
            ? "border-line bg-ivory/90 shadow-[0_1px_0_rgb(16_26_28/0.02)] backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent bg-ivory"
        )}
      >
        <div
          className={cx(
            "container-x grid grid-cols-[1fr_auto] items-center transition-[height] duration-500 ease-[var(--ease-tide)] lg:grid-cols-[1fr_auto_1fr]",
            compact ? "h-14 md:h-16" : "h-16 md:h-20"
          )}
        >
          <Logo />

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-10">
              {site.nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "link-draw pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors",
                        active ? "text-ink [background-size:100%_1px]" : "text-ink/70 hover:text-ink"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-0.5 md:gap-1.5">
            <button type="button" className={cx(iconBtn, "hidden md:grid")} aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search className="size-[18px]" strokeWidth={1.4} />
            </button>
            <Link href={accountHref} className={cx(iconBtn, "hidden md:grid")} aria-label={customer ? "Your account" : "Sign in"}>
              <User className="size-[18px]" strokeWidth={1.4} />
              {hydrated && customer && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-seafoam" aria-hidden />}
            </Link>
            <button type="button" className={iconBtn} aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`} onClick={openCart}>
              <ShoppingBag className="size-[18px]" strokeWidth={1.4} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[9.5px] font-semibold tabular-nums text-ivory animate-fade-in">
                  {count}
                </span>
              )}
            </button>
            <button type="button" className={cx(iconBtn, "lg:hidden")} aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <Menu className="size-5" strokeWidth={1.4} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSearch={() => { setMenuOpen(false); setSearchOpen(true); }} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
