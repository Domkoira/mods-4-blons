import type { Metadata } from "next";
import { faqs } from "@/data/content";
import { FAQ } from "@/components/content/FAQ";
import { PageIntro } from "@/components/content/PageIntro";
import { TextLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "FAQ", description: "Answers about Tidal Hemp products, testing, shipping and membership." };

export default function FaqPage() {
  return (
    <>
      <PageIntro eyebrow="FAQ" title="Questions," italic="answered." lede="Can’t find what you’re looking for? Our team usually replies within a few hours." />
      <div className="container-x grid gap-16 pb-24 md:pb-32 lg:grid-cols-[240px_1fr]">
        <nav aria-label="FAQ sections" className="hidden lg:block">
          <ul className="sticky top-28 space-y-3">
            {faqs.map((g) => (
              <li key={g.group}>
                <a href={`#${g.group.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="eyebrow text-ink/50 hover:text-ink">{g.group}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-16">
          {faqs.map((g) => (
            <section key={g.group} id={g.group.toLowerCase().replace(/[^a-z]+/g, "-")} className="scroll-mt-28">
              <h2 className="eyebrow mb-4 text-mist">{g.group}</h2>
              <FAQ items={g.items} idPrefix={g.group} />
            </section>
          ))}
          <TextLink href="/contact">Contact us</TextLink>
        </div>
      </div>
    </>
  );
}
