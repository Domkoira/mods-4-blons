import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getAllProducts } from "@/lib/catalog";
import { ShopView } from "@/components/shop/ShopView";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Explore the current Tidal Hemp collection — batch-tested flower, vapes, edibles, oils and more.",
};

export default async function ShopPage() {
  // Private products are passed through and filtered client-side by session.
  // With a real backend, query them server-side using the customer's token instead.
  const products = await getAllProducts();

  return (
    <>
      <section className="container-x pb-10 pt-12 md:pb-14 md:pt-20">
        <nav aria-label="Breadcrumb" className="eyebrow text-mist">
          <ol className="flex gap-2">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              Shop
            </li>
          </ol>
        </nav>
        <div className="mt-8 grid items-end gap-8 md:grid-cols-2">
          <h1 className="display text-6xl md:text-8xl">Shop all</h1>
          <p className="max-w-sm text-[15px] leading-relaxed text-mist md:justify-self-end md:text-right">
            Explore the current Tidal Hemp collection. Every product is batch-tested, with results one click away.
          </p>
        </div>
      </section>

      <div className="container-x">
        <div className="relative aspect-[16/7] overflow-hidden rounded-[var(--radius-md)] bg-shell md:aspect-[8/3]">
          <Image
            src="/images/collection-banner.jpg"
            alt="The Tidal Hemp collection: flower jar, oil, gummy tin and vape"
            fill
            priority
            sizes="(min-width: 1440px) 1360px, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <section className="container-x pb-24 pt-10 md:pb-32 md:pt-14">
        <Suspense>
          <ShopView products={products} />
        </Suspense>
      </section>
    </>
  );
}
