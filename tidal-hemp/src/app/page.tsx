import Image from "next/image";
import Link from "next/link";
import { getFeaturedProducts, getPrivateProducts } from "@/lib/catalog";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { Reveal, SectionHeading } from "@/components/ui/primitives";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PrivateAccess } from "@/components/home/PrivateAccess";

const values = [
  { k: "Batch tested", v: "Third-party lab results for every lot" },
  { k: "Small-batch", v: "Curated from trusted producers" },
  { k: "Discreet", v: "Unbranded, odor-sealed shipping" },
  { k: "Verified 21+", v: "Age-verified at checkout" },
];

const pillars = [
  { n: "01", k: "Tested", v: "Batch-specific laboratory testing from independent, accredited labs — potency, contaminants and more." },
  { n: "02", k: "Sourced", v: "Carefully selected products from trusted producers we know by name and have visited in person." },
  { n: "03", k: "Transparent", v: "Clear product information and accessible testing documentation, linked from every product." },
];

export default async function HomePage() {
  const [featured, privateReleases] = await Promise.all([getFeaturedProducts(4), getPrivateProducts()]);

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative isolate flex min-h-[calc(100svh-6.25rem)] flex-col overflow-hidden bg-ink text-ivory md:min-h-[min(calc(100svh-7.25rem),920px)]">
        <Image
          src="/images/hero-tide.jpg"
          alt="Calm open ocean at dusk with light on the water"
          fill
          priority
          sizes="100vw"
          className="-z-10 hidden scale-[1.02] animate-[fade-in_1.6s_ease-out_both] object-cover md:block"
        />
        <Image
          src="/images/hero-tide-mobile.jpg"
          alt="Calm open ocean at dusk with light on the water"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover md:hidden"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/10 md:from-ink/85 md:via-ink/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/50 via-transparent to-transparent" />

        <div className="container-x flex flex-1 flex-col justify-end pb-10 pt-28 md:pb-16">
          <div className="max-w-4xl">
            <p className="eyebrow animate-fade-up text-seafoam [animation-delay:200ms]">Batch-tested hemp · Est. on the coast</p>
            <h1 className="display mt-6 animate-fade-up text-[3.4rem] [animation-delay:350ms] sm:text-7xl md:text-8xl lg:text-[7.5rem]">
              Premium hemp.
              <br />
              <em className="text-ivory/90">Naturally elevated.</em>
            </h1>
            <p className="mt-7 max-w-lg animate-fade-up text-[15px] leading-relaxed text-ivory/75 [animation-delay:500ms] md:text-base">
              Carefully selected hemp products made for people who care about quality, consistency, and what goes into every batch.
            </p>
            <div className="mt-10 flex animate-fade-up flex-col gap-3 [animation-delay:650ms] sm:flex-row">
              <ButtonLink href="/shop" variant="light" size="lg">
                Shop the collection
              </ButtonLink>
              <ButtonLink href="/quality" variant="outline-light" size="lg">
                Our quality
              </ButtonLink>
            </div>
          </div>

          <div className="mt-14 hidden items-end justify-between border-t border-ivory/15 pt-6 md:flex">
            <p className="eyebrow text-ivory/50">Scroll</p>
            <Link
              href="/shop/tidal-reserve"
              className="group flex items-center gap-4 rounded-[var(--radius-md)] bg-ivory/[0.06] p-2 pr-5 backdrop-blur-md transition-colors hover:bg-ivory/[0.12]"
            >
              <span className="relative block h-14 w-11 overflow-hidden rounded-[3px]">
                <Image src="/images/products/tidal-reserve-1.jpg" alt="" fill sizes="44px" className="object-cover" />
              </span>
              <span>
                <span className="eyebrow block text-ivory/50">Now shipping</span>
                <span className="mt-1 block text-[13px]">Tidal Reserve · Batch TR-0926</span>
              </span>
              <span aria-hidden className="ml-2 transition-transform duration-500 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- VALUES STRIP ---------------- */}
      <section aria-label="Our promise" className="border-b border-line">
        <ul className="container-x grid grid-cols-2 md:grid-cols-4">
          {values.map((v, i) => (
            <li
              key={v.k}
              className={`py-7 md:py-9 ${i % 2 ? "pl-5" : "pr-5"} md:px-8 md:first:pl-0 ${i > 0 ? "md:border-l md:border-line" : ""} ${i < 2 ? "border-b border-line md:border-b-0" : ""}`}
            >
              <p className="eyebrow">{v.k}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-mist">{v.v}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------- FEATURED ---------------- */}
      <section className="container-x py-20 md:py-32">
        <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <SectionHeading title="Currently in the tide" subtitle="A curated selection of our most sought-after products." />
          <TextLink href="/shop">View all products</TextLink>
        </div>
        <ProductGrid products={featured} />
      </section>

      {/* ---------------- PRIVATE ACCESS ---------------- */}
      <PrivateAccess teasers={privateReleases} />

      {/* ---------------- QUALITY ---------------- */}
      <section className="container-x py-20 md:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow text-ocean/70">Our quality standard</p>
            <h2 className="display mt-6 text-5xl md:text-6xl xl:text-7xl">
              Know what’s in
              <br />
              <em>your product.</em>
            </h2>
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-ink/75">
              Every product we offer is sourced from trusted suppliers and backed by batch-specific testing. We believe premium
              hemp starts with transparency.
            </p>
            <ButtonLink href="/quality" variant="outline" className="mt-10">
              Explore our quality standard
            </ButtonLink>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] bg-ocean">
              <Image
                src="/images/quality-lab.jpg"
                alt="Row of sample vials ready for laboratory analysis"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
              <div className="absolute bottom-4 left-4 rounded-[var(--radius-sm)] bg-ivory/95 px-4 py-3 backdrop-blur md:bottom-6 md:left-6">
                <p className="eyebrow !text-[9.5px] text-mist">Latest batch</p>
                <p className="mt-1 text-[13px] font-semibold">TR-0926 · Passed 7 of 7 panels</p>
              </div>
            </div>
          </Reveal>
        </div>

        <ul className="mt-16 grid border-t border-line md:mt-24 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal as="li" key={p.k} delay={i * 100} className={`py-8 md:py-10 md:pr-10 ${i > 0 ? "border-t border-line md:border-l md:border-t-0 md:pl-10" : ""}`}>
              <p className="display text-2xl text-seafoam">{p.n}</p>
              <h3 className="eyebrow mt-5 !text-xs">{p.k}</h3>
              <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-mist">{p.v}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ---------------- ABOUT ---------------- */}
      <section className="bg-shell">
        <div className="container-x grid items-center gap-12 py-20 md:grid-cols-2 md:gap-16 md:py-0">
          <Reveal className="relative -mx-5 aspect-[4/5] overflow-hidden md:mx-0 md:my-24 md:rounded-[var(--radius-md)]">
            <Image
              src="/images/about-editorial.jpg"
              alt="A Tidal Hemp jar on a stone plinth in palm-filtered sunlight"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal delay={120} className="md:pl-6 lg:pl-16">
            <p className="eyebrow text-ocean/70">About Tidal Hemp</p>
            <h2 className="display mt-6 text-5xl md:text-6xl">
              Built around
              <br />
              <em>better hemp.</em>
            </h2>
            <div className="mt-8 max-w-md space-y-5 text-[15px] leading-relaxed text-ink/75">
              <p>Tidal Hemp was created around a simple idea: hemp products should be held to a higher standard.</p>
              <p>
                We curate products based on quality, consistency, transparency, and overall experience — not simply what’s
                trending.
              </p>
            </div>
            <TextLink href="/about" className="mt-10">
              Learn more about Tidal Hemp
            </TextLink>
          </Reveal>
        </div>
      </section>

      {/* ---------------- SIGN-OFF BAND ---------------- */}
      <section className="relative isolate overflow-hidden">
        <Image src="/images/shoreline.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-ink/25" />
        <div className="container-x flex min-h-[420px] flex-col items-center justify-center py-24 text-center text-ivory md:min-h-[560px]">
          <Reveal>
            <p className="eyebrow text-ivory/80">Tidal Hemp</p>
            <p className="display mt-6 text-6xl drop-shadow-[0_2px_24px_rgba(16,26,28,0.35)] md:text-8xl">
              <em>Find your current.</em>
            </p>
            <ButtonLink href="/shop" variant="light" className="mt-10">
              Shop all
            </ButtonLink>
          </Reveal>
        </div>
      </section>
    </>
  );
}
