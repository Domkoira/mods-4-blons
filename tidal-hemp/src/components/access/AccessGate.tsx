"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/config/site";
import { useAccess } from "@/context/AccessContext";
import { Button } from "@/components/ui/Button";
import { Overlay } from "@/components/ui/Overlay";

const isGated = (path: string) => site.compliance.gatedRoutes.some((r) => path === r || path.startsWith(r + "/"));

/**
 * Age verification.
 *
 * - On gated routes (catalog, account, checkout) it appears on arrival and can't be dismissed.
 * - Elsewhere it appears only when the visitor tries to buy, and can be closed.
 */
export function AccessGate() {
  const pathname = usePathname();
  const { hydrated, ageVerified, agePromptOpen, confirmAge, dismissAgePrompt, promptForRoute } = useAccess();
  const [routeLocked, setRouteLocked] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const locked = isGated(pathname) && !ageVerified;
    setRouteLocked(locked);
    if (locked) promptForRoute();
  }, [hydrated, pathname, ageVerified, promptForRoute]);

  const open = hydrated && agePromptOpen;

  return (
    <Overlay
      open={open}
      onClose={dismissAgePrompt}
      dismissible={!routeLocked}
      label="Age verification"
      side="center"
      className="!left-0 !top-0 !h-full !w-full !max-w-none !translate-x-0 !translate-y-0 !rounded-none !bg-ink text-ivory data-[open=false]:!scale-100"
    >
      <Image src="/images/hero-tide.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/50 to-ink/90" />

      <div className="relative z-10 flex h-full flex-col items-center justify-between px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.34em]">
          Tidal<span className="mx-[0.45em] inline-block h-3 w-px translate-y-px bg-current opacity-40" />Hemp
        </p>

        <div className="max-w-xl animate-fade-up">
          <p className="eyebrow text-seafoam">Welcome to Tidal Hemp</p>
          <h2 className="display mt-6 text-5xl md:text-7xl">
            Please confirm
            <br />
            <em>your age.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-ivory/75">
            You must be {site.compliance.minimumAge} or older, or meet the applicable legal age requirement where you live, to
            access and purchase our products.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="light" size="lg" onClick={confirmAge} className="sm:min-w-52" data-autofocus>
              I am {site.compliance.minimumAge}+ · Continue
            </Button>
            <Button
              variant="outline-light"
              size="lg"
              className="sm:min-w-40"
              onClick={() => {
                if (routeLocked) window.location.href = site.compliance.exitUrl;
                else dismissAgePrompt();
              }}
            >
              Exit
            </Button>
          </div>
        </div>

        <p className="max-w-lg text-[11px] leading-relaxed text-ivory/45">
          By entering you agree to our Terms and Privacy Policy. Age is verified again at checkout. Products contain less
          than 0.3% Δ9-THC by dry weight.
        </p>
      </div>
    </Overlay>
  );
}
