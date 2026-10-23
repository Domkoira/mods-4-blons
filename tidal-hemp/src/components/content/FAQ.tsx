import { Accordion } from "@/components/ui/Accordion";

export function FAQ({ items, idPrefix = "faq" }: { items: { q: string; a: string }[]; idPrefix?: string }) {
  return (
    <Accordion
      titleClassName="!normal-case !tracking-normal !text-[15px] md:!text-base !font-medium !py-6"
      items={items.map((it, i) => ({ id: `${idPrefix}-${i}`, title: it.q, content: <p className="max-w-2xl">{it.a}</p> }))}
    />
  );
}
