"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { cx } from "@/lib/format";

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

export function Accordion({
  items,
  defaultOpen = [],
  className,
  titleClassName,
}: {
  items: AccordionItem[];
  defaultOpen?: string[];
  className?: string;
  titleClassName?: string;
}) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const uid = useId();
  return (
    <div className={cx("border-t border-line", className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const btn = `${uid}-${item.id}-btn`;
        const panel = `${uid}-${item.id}-panel`;
        return (
          <div key={item.id} className="border-b border-line">
            <h3>
              <button
                id={btn}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen((o) => (isOpen ? o.filter((x) => x !== item.id) : [...o, item.id]))}
                className={cx(
                  "flex w-full items-center justify-between gap-6 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:text-ocean",
                  titleClassName
                )}
              >
                {item.title}
                <Plus
                  aria-hidden
                  strokeWidth={1.4}
                  className={cx("size-4 shrink-0 transition-transform duration-500 ease-[var(--ease-tide)]", isOpen && "rotate-45")}
                />
              </button>
            </h3>
            <div
              id={panel}
              role="region"
              aria-labelledby={btn}
              className={cx(
                "grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-tide)]",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden" inert={!isOpen}>
                <div className="pb-6 text-[14px] leading-relaxed text-ink/75">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
