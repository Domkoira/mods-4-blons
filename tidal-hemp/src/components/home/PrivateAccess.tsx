"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useAccess } from "@/context/AccessContext";
import type { Product } from "@/lib/types";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/primitives";

export function PrivateAccess({ teasers }: { teasers: Product[] }) {
  const { customer, hydrated } = useAccess();
  const member = hydrated && !!customer;

  return (
    <section className="relative isolate overflow-hidden bg-ink text-ivory">
      <Image src="/images/private-access.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-80" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/30" />

      <div className="container-x grid items-center gap-14 py-20 md:py-32 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow text-seafoam">Members</p>
          <h2 className="mt-6 text-[13px] font-semibold uppercase tracking-[0.28em]">Welcome to the tide</h2>
          <p className="display mt-5 text-5xl md:text-6xl">
            Some releases are
            <br />
            <em>worth the wait.</em>
          </p>
          <p className="mt-7 max-w-md text-[15px] leading-relaxed text-ivory/70">
            Some releases are reserved for verified Tidal Hemp customers. Create an account to access our complete collection,
            limited releases, batch information, and member-only drops.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            {member ? (
              <ButtonLink href="/account#private" variant="light" size="lg">
                View private releases
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/access" variant="light" size="lg">
                  Request access
                </ButtonLink>
                <Link href="/access?mode=signin" className="eyebrow link-draw pb-1 text-ivory/85 hover:text-ivory">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </Reveal>

        <Reveal delay={150}>
          <ul className="grid grid-cols-2 gap-3 md:gap-5">
            {teasers.slice(0, 2).map((p, i) => (
              <li key={p.id} className={i === 1 ? "translate-y-10" : ""}>
                <Link
                  href={member ? `/shop/${p.slug}` : "/access"}
                  className="group block overflow-hidden rounded-[var(--radius-md)] border border-ivory/10 bg-ivory/[0.04] backdrop-blur-sm"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={p.images[0].src}
                      alt={member ? p.images[0].alt : ""}
                      fill
                      sizes="(min-width: 1024px) 22vw, 45vw"
                      className={`object-cover transition-[filter,scale] duration-[1200ms] ease-[var(--ease-tide)] group-hover:scale-[1.03] ${member ? "" : "blur-[14px] brightness-75 saturate-50"}`}
                    />
                    {!member && (
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="grid size-11 place-items-center rounded-full border border-ivory/30 bg-ink/30 backdrop-blur">
                          <Lock className="size-4" strokeWidth={1.4} aria-hidden />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <p className="eyebrow truncate">{member ? p.name : "Member release"}</p>
                      <p className="mt-1 truncate text-xs text-ivory/55">{member ? p.subtitle : p.category}</p>
                    </div>
                    <span className="eyebrow hidden shrink-0 !text-[9px] text-seafoam sm:inline">Limited</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
