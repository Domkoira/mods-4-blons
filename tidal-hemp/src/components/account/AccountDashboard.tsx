"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, FileText, LogOut, Package, Truck } from "lucide-react";
import { products } from "@/data/products";
import { mockOrders } from "@/data/content";
import { site } from "@/config/site";
import { useAccess } from "@/context/AccessContext";
import { useCart } from "@/context/CartContext";
import { findVariant, productById } from "@/lib/catalog";
import { cx, formatDate, formatPrice } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";

const sections = [
  { id: "orders", label: "Orders" },
  { id: "private", label: "Private releases" },
  { id: "saved", label: "Saved" },
  { id: "lab-reports", label: "Lab reports" },
  { id: "account", label: "Account" },
];

function Panel({ id, title, subtitle, children, action }: { id: string; title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 border-t border-line pt-10 md:pt-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id={`${id}-title`} className="eyebrow !text-[13px] !tracking-[0.26em]">
            {title}
          </h2>
          {subtitle && <p className="mt-2 text-sm text-mist">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const statusStyle = {
  Processing: "bg-sand/50 text-ink",
  Shipped: "bg-seafoam/25 text-ocean",
  Delivered: "bg-ink/[0.06] text-ink/70",
} as const;

export function AccountDashboard() {
  const router = useRouter();
  const { customer, hydrated, saved, signOut } = useAccess();
  const { add } = useCart();
  const [active, setActive] = useState("orders");

  useEffect(() => {
    if (hydrated && !customer) router.replace("/access?mode=signin&next=/account");
  }, [hydrated, customer, router]);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [customer]);

  const savedProducts = useMemo(() => products.filter((p) => saved.includes(p.id)), [saved]);
  const privateProducts = useMemo(() => products.filter((p) => p.isPrivate), []);
  const reports = useMemo(() => {
    const ids = Array.from(new Set(mockOrders.flatMap((o) => o.lines.map((l) => l.productId))));
    return ids.map((id) => productById(id)!).filter(Boolean);
  }, []);

  if (!hydrated || !customer) return <div className="min-h-[70vh]" aria-busy="true" />;

  return (
    <div className="container-x pb-24 pt-12 md:pb-32 md:pt-16">
      {/* Welcome */}
      <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-ocean/70">
            {customer.tier} · Since {formatDate(customer.memberSince)}
          </p>
          <h1 className="mt-5 text-[13px] font-semibold uppercase tracking-[0.28em]">Welcome back</h1>
          <p className="display mt-3 text-6xl md:text-7xl">{customer.firstName}.</p>
        </div>
        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-md)] border border-line bg-line text-center md:min-w-[420px]">
          {[
            ["Orders", mockOrders.length],
            ["Saved", savedProducts.length],
            ["Releases", privateProducts.length],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col-reverse bg-ivory px-4 py-4">
              <dt className="eyebrow mt-1 !text-[9.5px] text-mist">{k}</dt>
              <dd className="display text-3xl">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[200px_1fr] lg:gap-16">
        {/* Section nav */}
        <nav aria-label="Account sections" className="no-scrollbar sticky top-14 z-20 -mx-5 overflow-x-auto border-b border-line bg-ivory/90 px-5 backdrop-blur-xl md:top-16 lg:top-28 lg:mx-0 lg:h-fit lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <ul className="flex gap-6 lg:flex-col lg:gap-1">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={active === s.id ? "true" : undefined}
                  className={cx(
                    "block whitespace-nowrap py-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors lg:py-2.5",
                    active === s.id ? "text-ink" : "text-ink/40 hover:text-ink"
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
            <li className="hidden lg:mt-6 lg:block">
              <button
                type="button"
                onClick={() => {
                  signOut();
                  router.push("/");
                }}
                className="flex items-center gap-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-mist hover:text-ink"
              >
                <LogOut className="size-3.5" strokeWidth={1.5} /> Sign out
              </button>
            </li>
          </ul>
        </nav>

        <div className="min-w-0 space-y-16 md:space-y-20">
          {/* ORDERS */}
          <Panel id="orders" title="Your orders" subtitle="Order history and tracking.">
            <ul className="space-y-4">
              {mockOrders.map((o) => (
                <li key={o.id} className="rounded-[var(--radius-md)] border border-line bg-white/40 p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow">Order {o.id}</p>
                      <p className="mt-1 text-[13px] text-mist">
                        Placed {formatDate(o.placedOn)} · {formatPrice(o.total)}
                      </p>
                    </div>
                    <span className={cx("rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", statusStyle[o.status])}>
                      {o.status}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-5">
                    <div className="flex -space-x-3">
                      {o.lines.map((l) => {
                        const f = findVariant(l.productId, l.variantId);
                        return f ? (
                          <div key={l.variantId} className="relative h-16 w-[52px] overflow-hidden rounded-[var(--radius-sm)] border-2 border-ivory bg-shell">
                            <Image src={f.product.images[0].src} alt={`${f.product.name} ${f.variant.label}`} fill sizes="52px" className="object-cover" />
                          </div>
                        ) : null;
                      })}
                      <p className="self-center pl-6 text-[13px] text-ink/70">
                        {o.lines
                          .map((l) => {
                            const f = findVariant(l.productId, l.variantId);
                            return f ? `${f.product.name} ${f.variant.label}${l.quantity > 1 ? ` ×${l.quantity}` : ""}` : "";
                          })
                          .join(", ")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {o.tracking ? (
                        <ButtonLink href={o.tracking.url} variant="outline" size="sm">
                          <Truck className="size-3.5" strokeWidth={1.5} /> Track
                        </ButtonLink>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => o.lines.forEach((l) => add(l.productId, l.variantId, l.quantity))}
                        >
                          <Package className="size-3.5" strokeWidth={1.5} /> Reorder
                        </Button>
                      )}
                    </div>
                  </div>

                  {o.status === "Shipped" && o.tracking && (
                    <div className="mt-6 border-t border-line pt-5">
                      <ol className="grid grid-cols-3 gap-2 text-[11px] uppercase tracking-[0.14em]" aria-label="Shipment progress">
                        {["Packed", "In transit", "Delivered"].map((step, i) => (
                          <li key={step} className="flex flex-col gap-2">
                            <span className={cx("h-[2px] rounded-full", i < 2 ? "bg-ocean" : "bg-ink/10")} />
                            <span className={i < 2 ? "text-ink" : "text-mist"}>{step}</span>
                          </li>
                        ))}
                      </ol>
                      <p className="mt-3 text-[12px] text-mist">
                        {o.tracking.carrier} · {o.tracking.number} · Estimated delivery in 2 days
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          {/* PRIVATE RELEASES */}
          <Panel id="private" title="Private releases" subtitle="Limited batches available to your account.">
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 xl:grid-cols-3">
              {privateProducts.map((p) => (
                <ProductCard key={p.id} product={p} showDescription={false} />
              ))}
              <div className="relative col-span-2 flex flex-col justify-between overflow-hidden rounded-[var(--radius-md)] bg-ink p-6 text-ivory xl:col-span-1">
                <Image src="/images/private-access.jpg" alt="" fill sizes="400px" className="object-cover opacity-60" />
                <div className="relative">
                  <p className="eyebrow text-seafoam">Next drop</p>
                  <p className="display mt-4 text-4xl">
                    Slack Tide
                    <br />
                    <em>Reserve</em>
                  </p>
                </div>
                <p className="relative mt-10 text-[13px] text-ivory/70">
                  Members are notified 48 hours before public release.
                </p>
              </div>
            </div>
          </Panel>

          {/* SAVED */}
          <Panel id="saved" title="Saved products" subtitle="Your wishlist and favorites.">
            {savedProducts.length ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 xl:grid-cols-3">
                {savedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} showDescription={false} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-mist">
                Nothing saved yet. Tap the heart on any product to keep it here.{" "}
                <Link href="/shop" className="text-ink underline underline-offset-4">
                  Browse the shop
                </Link>
              </p>
            )}
          </Panel>

          {/* LAB REPORTS */}
          <Panel id="lab-reports" title="Lab reports" subtitle="Certificates of analysis for the batches you’ve purchased.">
            <ul className="divide-y divide-line border-y border-line">
              {reports.map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-4">
                  <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-[3px] bg-shell">
                    <Image src={p.images[0].src} alt="" fill sizes="44px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow truncate">{p.name}</p>
                    <p className="mt-1 truncate text-[12px] text-mist">
                      Batch {p.batch.id} · Tested {formatDate(p.batch.testedOn)} · {p.batch.panels.length} panels passed
                    </p>
                  </div>
                  <Link
                    href={`/coa/${p.batch.id}`}
                    target="_blank"
                    className="flex shrink-0 items-center gap-2 rounded-[var(--radius-sm)] border border-line-strong px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors hover:border-ink"
                  >
                    <FileText className="size-3.5" strokeWidth={1.5} aria-hidden /> <span className="hidden sm:inline">View</span> COA
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          {/* ACCOUNT */}
          <Panel id="account" title="Your account" subtitle="Personal information.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-line p-6">
                <p className="eyebrow text-mist">Profile</p>
                <p className="mt-4 text-[15px]">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="mt-1 text-[14px] text-mist">{customer.email}</p>
                <p className="mt-4 inline-flex items-center gap-2 text-[12px] text-ocean">
                  <span className="size-1.5 rounded-full bg-seafoam" /> Age verified (21+)
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-line p-6">
                <p className="eyebrow text-mist">Default shipping address</p>
                <address className="mt-4 text-[14px] not-italic leading-relaxed">
                  {customer.shippingAddress.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="mt-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-mist hover:text-ink lg:hidden"
            >
              <LogOut className="size-3.5" strokeWidth={1.5} /> Sign out
            </button>
          </Panel>

          {/* COMMUNITY */}
          <section id="signal" className="relative overflow-hidden rounded-[var(--radius-md)] bg-ocean text-ivory">
            <div className="grid items-center gap-8 p-8 md:grid-cols-[1fr_auto] md:p-12">
              <div className="max-w-lg">
                <h2 className="eyebrow !text-[13px] !tracking-[0.26em]">Join the tide</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-ivory/75">
                  Get early notice of new releases, limited batches, restocks, and special offers.
                </p>
                <p className="mt-3 text-[12px] text-ivory/45">Delivered through our private Signal channel. Opt out any time.</p>
              </div>
              <ButtonLink href={site.signalUrl} variant="light">
                Join the community <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
              </ButtonLink>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
