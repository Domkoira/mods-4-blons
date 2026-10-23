"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { mockCustomer } from "@/data/content";
import type { Customer } from "@/lib/types";

/**
 * Age verification, customer session and saved products.
 *
 * Everything here is client-side placeholder logic persisted to localStorage.
 * In production: back age verification with a verification provider + an httpOnly
 * cookie checked in middleware, and swap `signIn`/`requestAccess` for your auth provider.
 */

interface AccessState {
  hydrated: boolean;
  ageVerified: boolean;
  customer: Customer | null;
  saved: string[];
  /** True while the age prompt should be displayed. */
  agePromptOpen: boolean;
  confirmAge: () => void;
  dismissAgePrompt: () => void;
  /** Runs `action` immediately if verified, otherwise after the customer confirms their age. */
  requireAge: (action?: () => void) => void;
  /** Shows the prompt on routes that are gated on arrival. */
  promptForRoute: () => void;
  signIn: (email: string) => void;
  requestAccess: (data: { firstName: string; lastName: string; email: string }) => void;
  signOut: () => void;
  toggleSaved: (productId: string) => void;
  isSaved: (productId: string) => boolean;
}

const AccessContext = createContext<AccessState | null>(null);

const KEYS = { age: "th.age-verified", customer: "th.customer", saved: "th.saved" };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — state still works for this visit */
  }
}

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [agePromptOpen, setAgePromptOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => {
    setAgeVerified(read(KEYS.age, false));
    setCustomer(read<Customer | null>(KEYS.customer, null));
    setSaved(read<string[]>(KEYS.saved, ["p_undertow", "p_slack_water"]));
    setHydrated(true);
  }, []);

  const confirmAge = useCallback(() => {
    setAgeVerified(true);
    write(KEYS.age, true);
    setAgePromptOpen(false);
    const next = pending.current;
    pending.current = null;
    next?.();
  }, []);

  const dismissAgePrompt = useCallback(() => {
    pending.current = null;
    setAgePromptOpen(false);
  }, []);

  const requireAge = useCallback(
    (action?: () => void) => {
      if (ageVerified) return action?.();
      pending.current = action ?? null;
      setAgePromptOpen(true);
    },
    [ageVerified]
  );

  const promptForRoute = useCallback(() => {
    if (!ageVerified) setAgePromptOpen(true);
  }, [ageVerified]);

  const signIn = useCallback((email: string) => {
    const c = { ...mockCustomer, email: email || mockCustomer.email };
    setCustomer(c);
    write(KEYS.customer, c);
    // A signed-in account implies the customer verified their age at sign-up.
    setAgeVerified(true);
    write(KEYS.age, true);
  }, []);

  const requestAccess = useCallback((data: { firstName: string; lastName: string; email: string }) => {
    const c: Customer = {
      ...mockCustomer,
      ...data,
      memberSince: new Date().toISOString().slice(0, 10),
      shippingAddress: [`${data.firstName} ${data.lastName}`, "Add a shipping address"],
    };
    setCustomer(c);
    write(KEYS.customer, c);
    setAgeVerified(true);
    write(KEYS.age, true);
  }, []);

  const signOut = useCallback(() => {
    setCustomer(null);
    write(KEYS.customer, null);
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      write(KEYS.saved, next);
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  const value = useMemo(
    () => ({
      hydrated,
      ageVerified,
      customer,
      saved,
      agePromptOpen,
      confirmAge,
      dismissAgePrompt,
      requireAge,
      promptForRoute,
      signIn,
      requestAccess,
      signOut,
      toggleSaved,
      isSaved,
    }),
    [hydrated, ageVerified, customer, saved, agePromptOpen, confirmAge, dismissAgePrompt, requireAge, promptForRoute, signIn, requestAccess, signOut, toggleSaved, isSaved]
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used inside <AccessProvider>");
  return ctx;
}
