"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAccess } from "@/context/AccessContext";
import { cx } from "@/lib/format";
import { Button } from "@/components/ui/Button";

function Field({
  label,
  id,
  hint,
  ...props
}: { label: string; id: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow !text-[10px] text-mist">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="mt-2 h-12 w-full rounded-[var(--radius-sm)] border border-line-strong bg-white/60 px-4 text-[15px] transition-colors placeholder:text-ink/30 focus:border-ink focus:bg-white focus:outline-none"
        {...props}
      />
      {hint && <p className="mt-1.5 text-[12px] text-mist">{hint}</p>}
    </div>
  );
}

/** Request access (sign-up) and sign-in, in one place. Placeholder auth. */
export function AccessForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { signIn, requestAccess } = useAccess();
  const [mode, setMode] = useState<"request" | "signin">(params.get("mode") === "signin" ? "signin" : "request");
  const [submitting, setSubmitting] = useState(false);
  const next = params.get("next");
  const destination = next && next.startsWith("/") ? next : "/account";

  const finish = () => {
    setSubmitting(true);
    setTimeout(() => router.push(destination), 450);
  };

  return (
    <div>
      <div role="tablist" aria-label="Account" className="grid grid-cols-2 border-b border-line">
        {(
          [
            ["request", "Request access"],
            ["signin", "Sign in"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cx(
              "relative h-14 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors",
              mode === m ? "text-ink" : "text-ink/40 hover:text-ink"
            )}
          >
            {label}
            <span className={cx("absolute inset-x-0 -bottom-px h-px bg-ink transition-transform duration-500", mode === m ? "scale-x-100" : "scale-x-0")} />
          </button>
        ))}
      </div>

      {mode === "request" ? (
        <form
          key="request"
          className="mt-8 animate-fade-in space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            requestAccess({
              firstName: String(f.get("firstName") || ""),
              lastName: String(f.get("lastName") || ""),
              email: String(f.get("email") || ""),
            });
            finish();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" id="firstName" autoComplete="given-name" required />
            <Field label="Last name" id="lastName" autoComplete="family-name" required />
          </div>
          <Field label="Email" id="email" type="email" autoComplete="email" required />
          <Field label="Date of birth" id="dob" type="date" required hint="You must be 21 or older. We verify age at checkout." />
          <Field label="Password" id="password" type="password" autoComplete="new-password" minLength={8} required />
          <label className="flex items-start gap-3 pt-1 text-[13px] leading-relaxed text-ink/75">
            <input type="checkbox" required className="mt-1 size-4 shrink-0 accent-ink" />
            <span>
              I confirm I am 21+ and agree to the{" "}
              <Link href="/legal/terms" className="underline underline-offset-4">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="underline underline-offset-4">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-3 text-[13px] leading-relaxed text-ink/75">
            <input type="checkbox" defaultChecked className="mt-1 size-4 shrink-0 accent-ink" />
            <span>Notify me about limited releases and restocks.</span>
          </label>
          <Button type="submit" full size="lg" disabled={submitting}>
            {submitting ? "Creating your account…" : "Request access"}
          </Button>
        </form>
      ) : (
        <form
          key="signin"
          className="mt-8 animate-fade-in space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            signIn(String(f.get("email") || ""));
            finish();
          }}
        >
          <Field label="Email" id="email" type="email" autoComplete="email" required defaultValue="jordan@example.com" />
          <Field label="Password" id="password" type="password" autoComplete="current-password" required defaultValue="tidalhemp" />
          <div className="flex justify-end">
            <Link href="/contact" className="text-[12px] text-mist underline-offset-4 hover:text-ink hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" full size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-[12px] text-mist">Demo: any email and password will sign you in.</p>
        </form>
      )}
    </div>
  );
}
