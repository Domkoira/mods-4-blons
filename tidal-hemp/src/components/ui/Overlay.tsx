"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cx } from "@/lib/format";

/**
 * Accessible overlay used for drawers, sheets and modals.
 * Handles Escape, scroll lock, focus trapping and focus restore.
 */
export function Overlay({
  open,
  onClose,
  label,
  side = "right",
  children,
  className,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  side?: "right" | "left" | "bottom" | "center" | "top";
  children: React.ReactNode;
  className?: string;
  dismissible?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  // Keep the latest callback without re-running the open/close effect.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    requestAnimationFrame(() => {
      const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0];
      first?.focus({ preventScroll: true });
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) closeRef.current();
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prev;
      restore.current?.focus?.({ preventScroll: true });
    };
  }, [open, dismissible]);

  if (!mounted) return null;

  const positions = {
    right: "inset-y-0 right-0 h-full w-full max-w-[440px] data-[open=false]:translate-x-full",
    left: "inset-y-0 left-0 h-full w-full max-w-[420px] data-[open=false]:-translate-x-full",
    bottom: "inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-[14px] data-[open=false]:translate-y-full",
    top: "inset-x-0 top-0 w-full data-[open=false]:-translate-y-full",
    center:
      "left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] data-[open=false]:opacity-0 data-[open=false]:scale-[0.98]",
  } as const;

  return createPortal(
    <div
      className={cx("fixed inset-0 z-[100] overflow-hidden", !open && "pointer-events-none invisible [transition:visibility_0s_linear_500ms]")}
      aria-hidden={!open}
    >
      <div
        className={cx(
          "absolute inset-0 bg-ink/40 backdrop-blur-[3px] transition-opacity duration-500 ease-[var(--ease-tide)]",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={dismissible ? onClose : undefined}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-open={open}
        inert={!open}
        className={cx(
          "absolute flex flex-col bg-ivory shadow-[var(--shadow-lift)] transition-[translate,scale,opacity] duration-500 ease-[var(--ease-tide)]",
          positions[side],
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function CloseButton({ onClick, label = "Close", className }: { onClick: () => void; label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cx("grid size-10 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink", className)}
    >
      <X className="size-[18px]" strokeWidth={1.5} />
    </button>
  );
}
