import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { PrintButton } from "@/components/content/PrintButton";

export const metadata: Metadata = { title: "Certificate of Analysis", robots: { index: false } };

export async function generateStaticParams() {
  return (await getAllProducts()).map((p) => ({ batch: p.batch.id }));
}

/**
 * Placeholder Certificate of Analysis rendered from batch data.
 * In production, link `batch.id` to the lab's PDF (e.g. /coa/TR-0926.pdf on your CDN).
 */
export default async function CoaPage({ params }: { params: Promise<{ batch: string }> }) {
  const { batch: batchId } = await params;
  const product = (await getAllProducts()).find((p) => p.batch.id === batchId);
  if (!product) notFound();
  const { batch } = product;
  const percent = batch.cannabinoids.every((c) => c.unit === "%");

  return (
    <div className="container-x py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <p className="eyebrow text-mist">Certificate of Analysis</p>
          <PrintButton />
        </div>

        <article className="rounded-[var(--radius-md)] border border-line bg-white p-6 shadow-[var(--shadow-soft)] md:p-12 print:border-0 print:shadow-none">
          <header className="flex flex-col justify-between gap-6 border-b border-ink pb-8 md:flex-row">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">{batch.lab}</p>
              <p className="mt-1 text-[12px] text-mist">ISO/IEC 17025:2017 Accredited · License #CAL-00000 (placeholder)</p>
            </div>
            <div className="md:text-right">
              <h1 className="display text-3xl md:text-4xl">Certificate of Analysis</h1>
              <p className="mt-1 text-[12px] text-mist">Sample ID {batch.id}-S01</p>
            </div>
          </header>

          <dl className="grid grid-cols-2 gap-6 border-b border-line py-8 text-[13px] md:grid-cols-4">
            {[
              ["Product", product.name],
              ["Matrix", product.category],
              ["Batch", batch.id],
              ["Tested", formatDate(batch.testedOn)],
              ["Client", "Tidal Hemp"],
              ["Method", "HPLC-DAD"],
              ["Status", "Pass"],
              ["Reported", formatDate(batch.testedOn)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow !text-[9.5px] text-mist">{k}</dt>
                <dd className="mt-1.5">{v}</dd>
              </div>
            ))}
          </dl>

          <section className="py-8">
            <h2 className="eyebrow">Cannabinoid profile</h2>
            <table className="mt-4 w-full text-[13px]">
              <thead>
                <tr className="border-b border-ink text-left">
                  <th scope="col" className="py-2 font-semibold">Analyte</th>
                  <th scope="col" className="py-2 text-right font-semibold">LOQ</th>
                  <th scope="col" className="py-2 text-right font-semibold">{percent ? "Result (%)" : "Result (mg/unit)"}</th>
                </tr>
              </thead>
              <tbody>
                {batch.cannabinoids.map((c) => (
                  <tr key={c.name} className="border-b border-line">
                    <th scope="row" className="py-2.5 text-left font-normal">{c.name}</th>
                    <td className="py-2.5 text-right tabular-nums text-mist">{percent ? "0.01" : "0.10"}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{c.value === 0 ? "ND" : c.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="border-t border-line py-8">
            <h2 className="eyebrow">Safety panels</h2>
            <ul className="mt-4 divide-y divide-line text-[13px]">
              {batch.panels.filter((p) => p !== "Cannabinoid potency").map((p) => (
                <li key={p} className="flex justify-between py-2.5">
                  <span>{p}</span>
                  <span className="font-semibold text-ocean">Pass</span>
                </li>
              ))}
            </ul>
          </section>

          <footer className="border-t border-line pt-8 text-[11px] leading-relaxed text-mist">
            <p>
              ND = not detected. LOQ = limit of quantitation. Results apply only to the sample tested. This document is a
              placeholder generated from batch data for design purposes and should be replaced with the laboratory’s signed
              certificate.
            </p>
            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="display text-2xl italic text-ink">M. Alvarez</p>
                <p className="mt-1 border-t border-line pt-1">Laboratory Director</p>
              </div>
              <p>Page 1 of 1</p>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
