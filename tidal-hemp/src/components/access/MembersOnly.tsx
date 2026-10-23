"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useAccess } from "@/context/AccessContext";
import type { Product } from "@/lib/types";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Wraps member-only content. Visitors without an account see a polished
 * invitation instead of the product.
 *
 * Note: this is a client-side placeholder. With a real backend, private products
 * should only be returned by the API for authenticated customers.
 */
export function MembersOnly({ product, children }: { product: Product; children: React.ReactNode }) {
  const { customer, hydrated } = useAccess();
  if (!hydrated) return <div className="min-h-[70vh]" aria-busy="true" />;
  if (customer) return <>{children}</>;

  return (
    <section className="relative isolate overflow-hidden bg-ink text-ivory">
      <Image src="/images/private-access.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-70" priority />
      <div className="container-x grid min-h-[78vh] items-center gap-12 py-20 md:grid-cols-2">
        <div className="max-w-lg">
          <span className="grid size-12 place-items-center rounded-full border border-ivory/25">
            <Lock className="size-4" strokeWidth={1.4} aria-hidden />
          </span>
          <p className="eyebrow mt-8 text-seafoam">Member release · {product.category}</p>
          <h1 className="display mt-5 text-5xl md:text-7xl">
            Reserved for
            <br />
            <em>the tide.</em>
          </h1>
          <p className="mt-6 text-[15px] leading-relaxed text-ivory/70">
            This is a limited release available to verified Tidal Hemp customers. Create an account to view it, along with
            batch information and member-only drops.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <ButtonLink href={`/access?next=/shop/${product.slug}`} variant="light" size="lg">
              Request access
            </ButtonLink>
            <Link href={`/access?mode=signin&next=/shop/${product.slug}`} className="eyebrow link-draw pb-1">
              Sign in
            </Link>
          </div>
        </div>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[var(--radius-md)] border border-ivory/10">
          <Image src={product.images[0].src} alt="" fill sizes="384px" className="scale-110 object-cover blur-2xl brightness-75 saturate-50" />
        </div>
      </div>
    </section>
  );
}
