"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { useAccess } from "@/context/AccessContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/Button";

const input =
  "h-12 w-full rounded-[var(--radius-sm)] border border-line-strong bg-white/60 px-4 text-[15px] placeholder:text-ink/35 focus:border-ink focus:bg-white focus:outline-none";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-8">
      <legend className="sr-only">{title}</legend>
      <p aria-hidden className="eyebrow flex items-center gap-3">
        <span className="grid size-6 place-items-center rounded-full border border-ink text-[10px]">{n}</span>
        {title}
      </p>
      <div className="mt-6 grid gap-4">{children}</div>
    </fieldset>
  );
}

/**
 * Checkout UI. Replace `onSubmit` with your payment + age-verification
 * providers (e.g. a hemp-compliant processor and an ID verification service).
 */
export function CheckoutView() {
  const { lines, subtotal, shipping, total, clear, count } = useCart();
  const { customer } = useAccess();
  const [placed, setPlaced] = useState<string | null>(null);

  if (placed) {
    return (
      <section className="container-x flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-ink text-ivory">
          <Check className="size-5" strokeWidth={1.5} />
        </span>
        <p className="eyebrow mt-8 text-ocean/70">Order {placed}</p>
        <h1 className="display mt-4 text-5xl md:text-7xl">
          Thank you. <em>It’s on the way.</em>
        </h1>
        <p className="mt-5 max-w-md text-[15px] text-mist">
          A confirmation and tracking details will arrive by email. COAs for your batches are available in your account.
        </p>
        <div className="mt-10 flex gap-3">
          <ButtonLink href="/account#orders">View orders</ButtonLink>
          <ButtonLink href="/shop" variant="outline">
            Keep shopping
          </ButtonLink>
        </div>
      </section>
    );
  }

  if (!count) {
    return (
      <section className="container-x flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <h1 className="display text-5xl">Your cart is empty.</h1>
        <ButtonLink href="/shop" className="mt-8">
          Shop the collection
        </ButtonLink>
      </section>
    );
  }

  return (
    <div className="container-x grid gap-12 pb-24 pt-10 md:pt-16 lg:grid-cols-[1fr_420px] lg:gap-20">
      <form
        className="order-2 lg:order-1"
        onSubmit={(e) => {
          e.preventDefault();
          setPlaced(`TH-${Math.floor(10500 + Math.random() * 400)}`);
          clear();
        }}
      >
        <h1 className="display text-5xl md:text-6xl">Checkout</h1>
        <p className="mt-3 flex items-center gap-2 text-[13px] text-mist">
          <Lock className="size-3.5" strokeWidth={1.5} /> Secure, encrypted checkout
        </p>

        <div className="mt-10 space-y-10">
          <Step n={1} title="Contact">
            <label className="sr-only" htmlFor="co-email">Email</label>
            <input id="co-email" className={input} type="email" placeholder="Email" autoComplete="email" defaultValue={customer?.email} required />
          </Step>

          <Step n={2} title="Shipping address">
            <div className="grid grid-cols-2 gap-4">
              <input aria-label="First name" className={input} placeholder="First name" autoComplete="given-name" defaultValue={customer?.firstName} required />
              <input aria-label="Last name" className={input} placeholder="Last name" autoComplete="family-name" defaultValue={customer?.lastName} required />
            </div>
            <input aria-label="Address" className={input} placeholder="Address" autoComplete="street-address" required />
            <div className="grid grid-cols-[1fr_90px_120px] gap-4">
              <input aria-label="City" className={input} placeholder="City" autoComplete="address-level2" required />
              <input aria-label="State" className={input} placeholder="State" autoComplete="address-level1" required />
              <input aria-label="ZIP code" className={input} placeholder="ZIP" autoComplete="postal-code" inputMode="numeric" required />
            </div>
          </Step>

          <Step n={3} title="Age verification">
            <div className="flex items-start gap-4 rounded-[var(--radius-md)] border border-line bg-shell/60 p-5">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-ocean" strokeWidth={1.4} />
              <div className="text-[13px] leading-relaxed text-ink/75">
                <p className="font-semibold text-ink">We verify every order.</p>
                <p className="mt-1">
                  Your name, address and date of birth are matched against public records. If we can’t verify you automatically,
                  we’ll ask for a photo of your ID. An adult signature may be required on delivery.
                </p>
              </div>
            </div>
            <label className="sr-only" htmlFor="co-dob">Date of birth</label>
            <input id="co-dob" className={input} type="date" required />
          </Step>

          <Step n={4} title="Payment">
            <div className="rounded-[var(--radius-md)] border border-dashed border-line-strong p-6 text-center text-[13px] text-mist">
              Payment provider connects here.
            </div>
          </Step>
        </div>

        <Button type="submit" full size="lg" className="mt-10">
          Place order · {formatPrice(total)}
        </Button>
        <p className="mt-4 text-center text-[12px] text-mist">
          You must meet applicable age requirements to purchase. By placing your order you agree to our{" "}
          <Link href="/legal/terms" className="underline underline-offset-4">Terms</Link>.
        </p>
      </form>

      <aside className="order-1 lg:order-2" aria-label="Order summary">
        <div className="rounded-[var(--radius-md)] bg-shell p-6 lg:sticky lg:top-24 md:p-8">
          <h2 className="eyebrow">Order summary</h2>
          <ul className="mt-6 space-y-5">
            {lines.map((l) => (
              <li key={l.variantId} className="flex items-center gap-4">
                <div className="relative h-[70px] w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-ivory">
                  <Image src={l.product.images[0].src} alt="" fill sizes="56px" className="object-cover" />
                  <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-ink text-[10px] text-ivory">
                    {l.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow truncate">{l.product.name}</p>
                  <p className="mt-1 text-[12px] text-mist">{l.variant.label}</p>
                </div>
                <p className="text-sm tabular-nums">{formatPrice(l.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-8 space-y-2 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-mist">Subtotal</dt><dd className="tabular-nums">{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-mist">Shipping</dt><dd className="tabular-nums">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            <div className="flex justify-between"><dt className="text-mist">Taxes</dt><dd className="text-mist">Calculated next</dd></div>
            <div className="flex justify-between border-t border-line pt-4 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(total)}</dd></div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
