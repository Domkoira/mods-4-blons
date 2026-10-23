import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { MembersOnly } from "@/components/access/MembersOnly";
import { SectionHeading } from "@/components/ui/primitives";

export async function generateStaticParams() {
  return (await getAllProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  if (product.isPrivate) return { title: "Member release", robots: { index: false } };
  return {
    title: `${product.name} — ${product.subtitle}`,
    description: product.shortDescription,
    openGraph: { images: [product.images[0].src] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product, 4);

  const content = (
    <>
      <div className="container-x pt-4 md:pt-10">
        <nav aria-label="Breadcrumb" className="eyebrow mb-4 hidden text-mist md:block">
          <ol className="flex gap-2">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-ink">
                {product.category}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 md:grid-cols-12 md:gap-10 lg:gap-16">
          <div className="md:col-span-7">
            <ProductGallery images={product.images} name={product.name} />
          </div>
          <div className="md:col-span-5">
            <div className="md:sticky md:top-24">
              <PurchasePanel product={product} />
            </div>
          </div>
        </div>
      </div>

      <section className="container-x py-24 md:py-32">
        <div className="mb-12 md:mb-16">
          <SectionHeading title="You may also like" subtitle="More from the current collection." />
        </div>
        <ProductGrid products={related} />
      </section>
    </>
  );

  return product.isPrivate ? <MembersOnly product={product}>{content}</MembersOnly> : content;
}
