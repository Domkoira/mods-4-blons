import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalPages } from "@/data/content";
import { site } from "@/config/site";
import { formatDate } from "@/lib/format";

export function generateStaticParams() {
  return Object.keys(legalPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = legalPages[(await params).slug];
  return page ? { title: page.title } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = legalPages[slug];
  if (!page) notFound();
  return (
    <article className="container-x max-w-3xl pb-24 pt-14 md:pb-32 md:pt-24">
      <p className="eyebrow text-ocean/70">Last updated {formatDate(page.updated)}</p>
      <h1 className="display mt-6 text-5xl md:text-7xl">{page.title}</h1>
      <div className="mt-12 space-y-6 text-[16px] leading-relaxed text-ink/75">
        {page.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <p className="mt-16 border-t border-line pt-8 text-[12px] leading-relaxed text-mist">{site.compliance.disclaimer}</p>
    </article>
  );
}
