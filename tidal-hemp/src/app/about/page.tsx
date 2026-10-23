import type { Metadata } from "next";
import Image from "next/image";
import { PageIntro } from "@/components/content/PageIntro";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "About",
  description: "Tidal Hemp was created around a simple idea: hemp products should be held to a higher standard.",
};

const principles = [
  ["Curated, not collected", "We carry fewer products on purpose. Each one earns its place on quality, consistency and experience — never because it's trending."],
  ["Known producers", "We buy from a short list of growers and makers we've met, visited, and worked with over many harvests."],
  ["Proof, not promises", "Every batch is independently tested, and every result is published. If it doesn't pass, it doesn't ship."],
  ["Considered by design", "From UV-protective glass to nitrogen-sealed jars, packaging exists to protect what's inside — and nothing more."],
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About Tidal Hemp"
        title="Built around"
        italic="better hemp."
        lede="Tidal Hemp was created around a simple idea: hemp products should be held to a higher standard. We curate based on quality, consistency, transparency, and overall experience — not simply what's trending."
      />

      <div className="container-x">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-md)] md:aspect-[21/9]">
          <Image src="/images/hero-tide.jpg" alt="The ocean at dusk" fill priority sizes="100vw" className="object-cover" />
        </div>
      </div>

      <section className="container-x grid gap-12 py-24 md:grid-cols-12 md:py-32">
        <Reveal className="md:col-span-5">
          <p className="display text-4xl md:text-5xl">
            We started on the coast,
            <em> where things move at their own pace.</em>
          </p>
        </Reveal>
        <Reveal delay={120} className="space-y-6 text-[16px] leading-relaxed text-ink/75 md:col-span-6 md:col-start-7">
          <p>
            The hemp shelf had become loud: bright packaging, vague claims, and very little information about what was actually
            inside. We wanted the opposite — a quiet, considered place to buy hemp from people who care how it's grown, cured,
            and tested.
          </p>
          <p>
            So we built Tidal Hemp the way we'd want to shop: a small, carefully chosen collection, honest descriptions, and
            batch-specific lab results one click from every product.
          </p>
          <p>
            The name comes from the tide itself — steady, cyclical, and impossible to rush. Good hemp works the same way.
          </p>
        </Reveal>
      </section>

      <section className="bg-shell">
        <div className="container-x grid gap-12 py-24 md:grid-cols-2 md:items-center md:py-32">
          <Reveal className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)]">
            <Image src="/images/about-editorial.jpg" alt="A Tidal Hemp jar in natural light" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </Reveal>
          <div>
            <p className="eyebrow text-ocean/70">What we believe</p>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {principles.map(([k, v], i) => (
                <Reveal as="li" key={k} delay={i * 80} className="py-7">
                  <h2 className="eyebrow !text-xs">{k}</h2>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-mist">{v}</p>
                </Reveal>
              ))}
            </ul>
            <ButtonLink href="/quality" className="mt-10">
              Our quality standard
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
