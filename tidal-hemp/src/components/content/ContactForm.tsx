"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const field =
  "w-full rounded-[var(--radius-sm)] border border-line-strong bg-white/60 px-4 text-[15px] focus:border-ink focus:bg-white focus:outline-none";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <div className="rounded-[var(--radius-md)] border border-line p-10">
        <p className="display text-4xl">Thank you.</p>
        <p className="mt-3 text-[15px] text-mist">We’ve received your message and will reply shortly.</p>
      </div>
    );
  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow !text-[10px] text-mist">Name</span>
          <input required autoComplete="name" className={`${field} mt-2 h-12`} />
        </label>
        <label className="block">
          <span className="eyebrow !text-[10px] text-mist">Email</span>
          <input required type="email" autoComplete="email" className={`${field} mt-2 h-12`} />
        </label>
      </div>
      <label className="block">
        <span className="eyebrow !text-[10px] text-mist">Order number (optional)</span>
        <input className={`${field} mt-2 h-12`} />
      </label>
      <label className="block">
        <span className="eyebrow !text-[10px] text-mist">Message</span>
        <textarea required rows={6} className={`${field} mt-2 py-3`} />
      </label>
      <Button type="submit" size="lg" className="justify-self-start">
        Send message
      </Button>
    </form>
  );
}
