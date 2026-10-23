"use client";

import Link from "next/link";
import { ArrowUpRight, Search, User } from "lucide-react";
import { site } from "@/config/site";
import { useAccess } from "@/context/AccessContext";
import { CloseButton, Overlay } from "@/components/ui/Overlay";
import { Logo } from "./Logo";

export function MobileMenu({ open, onClose, onSearch }: { open: boolean; onClose: () => void; onSearch: () => void }) {
  const { customer } = useAccess();
  return (
    <Overlay open={open} onClose={onClose} label="Menu" side="right" className="!max-w-none sm:!max-w-md">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
        <Logo />
        <CloseButton onClick={onClose} label="Close menu" className="-mr-2" />
      </div>

      <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 pt-8">
        <ul>
          {[...site.nav, { label: "Contact", href: "/contact" }].map((item, i) => (
            <li
              key={item.href}
              className={`border-b border-line transition-[opacity,translate] duration-700 ease-[var(--ease-tide)] ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
              style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
            >
              <Link
                href={item.href}
                onClick={onClose}
                className="display flex items-center justify-between py-5 text-[2.6rem] text-ink"
              >
                {item.label}
                <ArrowUpRight className="size-5 text-ink/40" strokeWidth={1.2} />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onSearch}
            className="flex h-14 items-center gap-3 rounded-[var(--radius-md)] border border-line-strong px-4 text-[11px] font-semibold uppercase tracking-[0.18em]"
          >
            <Search className="size-4" strokeWidth={1.4} /> Search
          </button>
          <Link
            href={customer ? "/account" : "/access?mode=signin"}
            onClick={onClose}
            className="flex h-14 items-center gap-3 rounded-[var(--radius-md)] border border-line-strong px-4 text-[11px] font-semibold uppercase tracking-[0.18em]"
          >
            <User className="size-4" strokeWidth={1.4} /> {customer ? "Account" : "Sign in"}
          </Link>
        </div>
      </nav>

      <div className="shrink-0 bg-ink px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-ivory">
        <p className="eyebrow text-seafoam">Welcome to the Tide</p>
        <p className="mt-2 text-sm leading-relaxed text-ivory/70">
          Members get early access to limited releases and batch information.
        </p>
        {!customer && (
          <Link href="/access" onClick={onClose} className="eyebrow mt-4 inline-block border-b border-ivory/40 pb-1">
            Request access
          </Link>
        )}
      </div>
    </Overlay>
  );
}
