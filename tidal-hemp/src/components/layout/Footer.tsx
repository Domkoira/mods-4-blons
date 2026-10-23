import Link from "next/link";
import { site, type NavItem } from "@/config/site";
import { NewsletterForm } from "./NewsletterForm";

function Column({ title, items }: { title: string; items: readonly NavItem[] }) {
  return (
    <div>
      <h3 className="eyebrow text-ivory/45">{title}</h3>
      <ul className="mt-5 space-y-3">
        {items.map((item) => {
          const external = item.href.startsWith("http");
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="link-draw pb-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/85 hover:text-ivory"
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-ivory">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-seafoam/40 to-transparent" />
      <div className="container-x pb-10 pt-20 md:pt-28">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.34em]">
              Tidal<span className="mx-[0.45em] inline-block h-3 w-px translate-y-px bg-current opacity-35" />Hemp
            </p>
            <p className="display mt-8 text-[2.5rem] text-ivory/95 md:text-5xl">
              Quality moves
              <br />
              <em className="text-seafoam">with the tide.</em>
            </p>
            <p className="mt-8 text-sm leading-relaxed text-ivory/60">
              Release notes, restocks and the occasional dispatch from the coast. No noise.
            </p>
            <NewsletterForm />
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4">
            <Column title="Navigate" items={site.footer.navigation} />
            <Column title="Customer" items={site.footer.customer} />
            <Column title="Legal" items={site.footer.legal} />
            <Column title="Social" items={site.footer.social} />
          </div>
        </div>

        <div className="mt-20 border-t border-ivory/10 pt-8">
          <p className="max-w-5xl text-[11px] leading-relaxed text-ivory/45">{site.compliance.disclaimer}</p>
          <div className="mt-8 flex flex-col gap-3 text-[11px] uppercase tracking-[0.18em] text-ivory/45 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Tidal Hemp. All rights reserved.</p>
            <p>For adults {site.compliance.minimumAge}+ only</p>
          </div>
        </div>
      </div>

      {/* Oversized wordmark — a quiet editorial sign-off */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p className="display translate-y-[24%] whitespace-nowrap text-center text-[19vw] leading-none text-ivory/[0.04]">
          Tidal Hemp
        </p>
      </div>
    </footer>
  );
}
