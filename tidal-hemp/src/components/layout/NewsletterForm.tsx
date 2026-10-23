"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

/** Email capture. Wire `onSubmit` to your ESP (Klaviyo, Postscript, etc.). */
export function NewsletterForm() {
  const [done, setDone] = useState(false);
  return (
    <form
      className="mt-6 flex h-12 items-center border-b border-ivory/30 focus-within:border-ivory"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <label htmlFor="footer-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-email"
        type="email"
        required
        placeholder={done ? "You're on the list." : "Email address"}
        disabled={done}
        className="h-full flex-1 bg-transparent text-sm text-ivory placeholder:text-ivory/40 focus:outline-none"
      />
      <button type="submit" aria-label="Subscribe" disabled={done} className="grid size-10 place-items-center text-ivory/80 hover:text-ivory">
        {done ? <Check className="size-4" strokeWidth={1.5} /> : <ArrowRight className="size-4" strokeWidth={1.5} />}
      </button>
    </form>
  );
}
