import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow text-ocean/70">404</p>
      <h1 className="display mt-6 text-6xl md:text-8xl">
        Lost <em>at sea.</em>
      </h1>
      <p className="mt-6 max-w-sm text-[15px] text-mist">The page you’re looking for has drifted. Let’s get you back to shore.</p>
      <ButtonLink href="/" className="mt-10">
        Return home
      </ButtonLink>
    </section>
  );
}
