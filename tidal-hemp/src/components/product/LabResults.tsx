import Link from "next/link";
import { Check, FileText } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { BatchInfo } from "@/lib/types";

/** Batch summary + link to the full Certificate of Analysis. */
export function LabResults({ batch, compact }: { batch: BatchInfo; compact?: boolean }) {
  const percent = batch.cannabinoids.every((c) => c.unit === "%");
  const max = Math.max(...batch.cannabinoids.map((c) => c.value), 1);

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-3 gap-4 border-b border-line pb-5 text-[13px]">
        <div>
          <dt className="eyebrow !text-[9.5px] text-mist">Batch</dt>
          <dd className="mt-1.5 font-semibold tabular-nums">{batch.id}</dd>
        </div>
        <div>
          <dt className="eyebrow !text-[9.5px] text-mist">Tested</dt>
          <dd className="mt-1.5">{formatDate(batch.testedOn)}</dd>
        </div>
        <div>
          <dt className="eyebrow !text-[9.5px] text-mist">Laboratory</dt>
          <dd className="mt-1.5">{batch.lab}</dd>
        </div>
      </dl>

      <table className="w-full text-[13px]">
        <caption className="sr-only">Cannabinoid results for batch {batch.id}</caption>
        <thead>
          <tr className="text-left">
            <th scope="col" className="eyebrow !text-[9.5px] pb-2 font-semibold text-mist">
              Cannabinoid
            </th>
            <th scope="col" className="eyebrow !text-[9.5px] pb-2 text-right font-semibold text-mist">
              {percent ? "% by weight" : "Per unit"}
            </th>
          </tr>
        </thead>
        <tbody>
          {batch.cannabinoids.map((c) => {
            const total = c.name.startsWith("Total");
            return (
              <tr key={c.name} className="border-t border-line">
                <th scope="row" className={`py-2.5 pr-4 text-left ${total ? "font-semibold" : "font-normal"}`}>
                  <span className="flex items-center gap-3">
                    <span className="w-36 shrink-0">{c.name}</span>
                    {!total && !compact && (
                      <span className="hidden h-[3px] flex-1 overflow-hidden rounded-full bg-ink/[0.07] sm:block" aria-hidden>
                        <span className="block h-full bg-seafoam" style={{ width: `${Math.max(2, (c.value / max) * 100)}%` }} />
                      </span>
                    )}
                  </span>
                </th>
                <td className={`py-2.5 text-right tabular-nums ${total ? "font-semibold" : ""}`}>
                  {c.value === 0 ? "ND" : `${c.value}${c.unit === "%" ? "%" : " mg"}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!compact && (
        <div>
          <p className="eyebrow !text-[9.5px] text-mist">Panels passed</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
            {batch.panels.map((p) => (
              <li key={p} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-ocean" strokeWidth={2} aria-hidden /> {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/coa/${batch.id}`}
        target="_blank"
        className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-[var(--radius-sm)] border border-ink text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-ivory sm:w-auto sm:px-8"
      >
        <FileText className="size-4" strokeWidth={1.4} aria-hidden />
        View COA
        <span className="sr-only">(opens in a new tab)</span>
      </Link>
    </div>
  );
}
