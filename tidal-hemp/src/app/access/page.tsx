import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { AccessForm } from "@/components/access/AccessForm";

export const metadata: Metadata = {
  title: "Request access",
  description: "Create a Tidal Hemp account for private releases, batch information and member-only drops.",
};

const perks = [
  ["Private releases", "Limited batches offered to members first."],
  ["Batch information", "COAs for every product you've purchased, in one place."],
  ["Early notice", "Restocks and new releases, before they're public."],
];

export default function AccessPage() {
  return (
    <div className="grid min-h-[calc(100dvh-6.25rem)] lg:grid-cols-2">
      <section className="relative isolate hidden overflow-hidden bg-ink text-ivory lg:block">
        <Image src="/images/private-access.jpg" alt="" fill priority sizes="50vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="flex h-full flex-col justify-end p-12 xl:p-16">
          <p className="eyebrow text-seafoam">Welcome to the tide</p>
          <p className="display mt-6 text-6xl xl:text-7xl">
            A better way
            <br />
            <em>to shop hemp.</em>
          </p>
          <ul className="mt-12 grid gap-6 border-t border-ivory/15 pt-8 xl:grid-cols-3">
            {perks.map(([k, v]) => (
              <li key={k}>
                <p className="eyebrow">{k}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-ivory/60">{v}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-start justify-center px-5 py-14 md:items-center md:py-20">
        <div className="w-full max-w-md">
          <p className="eyebrow text-ocean/70">Tidal Hemp account</p>
          <h1 className="display mt-5 text-5xl md:text-6xl">
            Join <em>the tide.</em>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-mist">
            Some releases are reserved for verified Tidal Hemp customers. Create an account to access the complete collection.
          </p>
          <div className="mt-10">
            <Suspense>
              <AccessForm />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
