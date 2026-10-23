"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { site } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CloseButton, Overlay } from "@/components/ui/Overlay";
import { QuantitySelector } from "@/components/ui/primitives";

export function CartDrawer() {
  const router = useRouter();
  const { lines, count, subtotal, shipping, total, toFreeShipping, isOpen, close, setQuantity, remove } = useCart();
  const progress = Math.min(100, (subtotal / site.shipping.freeThreshold) * 100);

  return (
    <Overlay open={isOpen} onClose={close} label="Your cart" side="right">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 md:h-20 md:px-7">
        <h2 className="eyebrow !text-xs">
          Your Cart <span className="ml-1 text-mist">({count})</span>
        </h2>
        <CloseButton onClick={close} label="Close cart" className="-mr-2" />
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <p className="display text-4xl">Your cart is empty.</p>
          <p className="mt-3 max-w-xs text-sm text-mist">Explore the current collection — every batch is tested and documented.</p>
          <ButtonLink href="/shop" className="mt-8" onClick={close}>
            Shop the collection
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="shrink-0 border-b border-line px-5 py-4 md:px-7">
            <p className="text-xs text-mist">
              {toFreeShipping > 0 ? (
                <>
                  You’re <span className="font-semibold text-ink">{formatPrice(toFreeShipping)}</span> away from free shipping.
                </>
              ) : (
                <span className="text-ink">Your order qualifies for free shipping.</span>
              )}
            </p>
            <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-ink/10" aria-hidden>
              <div className="h-full bg-ocean transition-[width] duration-700 ease-[var(--ease-tide)]" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <ul className="flex-1 divide-y divide-line overflow-y-auto px-5 md:px-7">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-4 py-5">
                <Link
                  href={`/shop/${l.product.slug}`}
                  onClick={close}
                  className="relative aspect-[4/5] w-[84px] shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-shell"
                >
                  <Image src={l.product.images[0].src} alt={l.product.images[0].alt} fill sizes="84px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/shop/${l.product.slug}`} onClick={close} className="eyebrow block truncate">
                        {l.product.name}
                      </Link>
                      <p className="mt-1 text-[13px] text-mist">{l.product.subtitle}</p>
                      <p className="mt-0.5 text-[13px] text-mist">{l.variant.label}</p>
                    </div>
                    <p className="text-sm tabular-nums">{formatPrice(l.lineTotal)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <QuantitySelector
                      size="sm"
                      min={0}
                      value={l.quantity}
                      onChange={(n) => setQuantity(l.productId, l.variantId, n)}
                      label={`Quantity of ${l.product.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => remove(l.productId, l.variantId)}
                      className="text-[11px] uppercase tracking-[0.16em] text-mist underline-offset-4 hover:text-ink hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="shrink-0 border-t border-line bg-ivory px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 md:px-7">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-mist">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mist">Shipping estimate</dt>
                <dd className="tabular-nums">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(total)}</dd>
              </div>
            </dl>
            <Button
              full
              size="lg"
              className="mt-5"
              onClick={() => {
                close();
                router.push("/checkout");
              }}
            >
              Checkout
            </Button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-mist">
              You must meet applicable age requirements to purchase.
            </p>
          </div>
        </>
      )}
    </Overlay>
  );
}
