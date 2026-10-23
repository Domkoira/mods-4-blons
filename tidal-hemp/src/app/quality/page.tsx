import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { PageIntro } from "@/components/content/PageIntro";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Quality",
  description: "Every Tidal Hemp product is sourced from trusted producers and backed by batch-specific testing.",
};

const steps = [
  ["01", "Sourcing", "We work with a short list of licensed producers. Before anything is listed, we review their cultivation, extraction and handling practices in person."],
  ["02", "Sensory review", "Every new batch is evaluated by our team for aroma, structure, flavor and consistency against previous lots."],
  ["03", "Independent testing", "Samples go to ISO/IEC 17025-accredited labs for potency and, depending on the product, terpenes, heavy metals, pesticides, residual solvents, microbials and mycotoxins."],
  ["04", "Release", "Only batches that pass every panel are released. The COA is published to the product page the day it goes live."],
];

export default async function QualityPage() {
  const products = await getProducts();
  return (
    <>
      <PageIntro
        eyebrow="Our quality standard"
        title="Know what’s in"
        italic="your product."
        lede="Every product we offer is sourced from trusted suppliers and backed by batch-specific testing. We believe premium hemp starts with transparency."
      />

      <section className="container-x">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-md)] bg-ocean md:aspect-[21/9]">
          <Image src="/images/quality-lab.jpg" alt="Samples prepared for laboratory analysis" fill priority sizes="100vw" className="object-cover" />
        </div>
      </section>

      <section className="container-x py-24 md:py-32">
        <h2 className="eyebrow !text-[13px] !tracking-[0.28em]">From producer to your door</h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-line bg-line md:grid-cols-2 xl:grid-cols-4">
          {steps.map(([n, k, v], i) => (
            <Reveal as="li" key={k} delay={i * 80} className="bg-ivory p-8 md:p-10">
              <p className="display text-4xl text-seafoam">{n}</p>
              <h3 className="eyebrow mt-8 !text-xs">{k}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-mist">{v}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="coa" className="bg-shell">
        <div className="container-x py-24 md:py-32">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-ocean/70">Testing library</p>
              <h2 className="display mt-5 text-5xl md:text-6xl">Current batch results</h2>
            </div>
            <p className="max-w-sm text-[14px] text-mist">Every product currently in the collection, with the certificate for the batch we’re shipping now.</p>
          </div>
          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[640px] text-[14px]">
              <thead>
                <tr className="border-b border-ink text-left">
                  {["Product", "Batch", "Tested", "Laboratory", ""].map((h) => (
                    <th key={h} scope="col" className="eyebrow !text-[10px] pb-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-line">
                    <td className="py-4">
                      <Link href={`/shop/${p.slug}`} className="font-semibold uppercase tracking-[0.14em] hover:text-ocean">{p.name}</Link>
                      <span className="ml-2 text-mist">{p.subtitle}</span>
                    </td>
                    <td className="py-4 tabular-nums">{p.batch.id}</td>
                    <td className="py-4">{formatDate(p.batch.testedOn)}</td>
                    <td className="py-4 text-mist">{p.batch.lab}</td>
                    <td className="py-4 text-right">
                      <Link href={`/coa/${p.batch.id}`} target="_blank" className="eyebrow link-draw pb-0.5">View COA</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ButtonLink href="/shop" className="mt-12">Shop the collection</ButtonLink>
        </div>
      </section>
    </>
  );
}
