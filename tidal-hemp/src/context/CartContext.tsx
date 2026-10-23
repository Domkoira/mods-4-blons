"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { site } from "@/config/site";
import { findVariant } from "@/lib/catalog";
import type { CartLine, Product, ProductVariant } from "@/lib/types";
import { useAccess } from "./AccessContext";

export interface ResolvedLine extends CartLine {
  product: Product;
  variant: ProductVariant;
  lineTotal: number;
}

interface CartState {
  lines: ResolvedLine[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  /** Amount left before free shipping applies (0 when qualified). */
  toFreeShipping: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Adds to cart after age verification, then opens the drawer. */
  add: (productId: string, variantId: string, quantity?: number) => void;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  remove: (productId: string, variantId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);
const KEY = "th.cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { requireAge } = useAccess();
  const [raw, setRaw] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored) setRaw(JSON.parse(stored));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(raw));
    } catch {
      /* ignore */
    }
  }, [raw, hydrated]);

  const add = useCallback(
    (productId: string, variantId: string, quantity = 1) => {
      requireAge(() => {
        setRaw((prev) => {
          const existing = prev.find((l) => l.productId === productId && l.variantId === variantId);
          if (existing)
            return prev.map((l) => (l === existing ? { ...l, quantity: Math.min(l.quantity + quantity, 10) } : l));
          return [...prev, { productId, variantId, quantity }];
        });
        setOpen(true);
      });
    },
    [requireAge]
  );

  const setQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    setRaw((prev) =>
      quantity <= 0
        ? prev.filter((l) => !(l.productId === productId && l.variantId === variantId))
        : prev.map((l) =>
            l.productId === productId && l.variantId === variantId ? { ...l, quantity: Math.min(quantity, 10) } : l
          )
    );
  }, []);

  const remove = useCallback((productId: string, variantId: string) => {
    setRaw((prev) => prev.filter((l) => !(l.productId === productId && l.variantId === variantId)));
  }, []);

  const value = useMemo<CartState>(() => {
    const lines: ResolvedLine[] = raw.flatMap((l) => {
      const found = findVariant(l.productId, l.variantId);
      return found ? [{ ...l, ...found, lineTotal: found.variant.price * l.quantity }] : [];
    });
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const qualifies = subtotal >= site.shipping.freeThreshold;
    const shipping = subtotal === 0 || qualifies ? 0 : site.shipping.flatRate;
    return {
      lines,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
      toFreeShipping: Math.max(0, site.shipping.freeThreshold - subtotal),
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQuantity,
      remove,
      clear: () => setRaw([]),
    };
  }, [raw, isOpen, add, setQuantity, remove]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
