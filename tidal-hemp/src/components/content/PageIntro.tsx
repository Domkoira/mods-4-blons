import { cx } from "@/lib/format";

/** Editorial page header used by informational pages. */
export function PageIntro({
  eyebrow,
  title,
  italic,
  lede,
  className,
}: {
  eyebrow: string;
  title: string;
  italic?: string;
  lede?: string;
  className?: string;
}) {
  return (
    <header className={cx("container-x pb-14 pt-14 md:pb-20 md:pt-24", className)}>
      <p className="eyebrow animate-fade-up text-ocean/70">{eyebrow}</p>
      <h1 className="display mt-6 max-w-5xl animate-fade-up text-[3.25rem] [animation-delay:120ms] md:text-8xl">
        {title}
        {italic && (
          <>
            <br />
            <em>{italic}</em>
          </>
        )}
      </h1>
      {lede && (
        <p className="mt-8 max-w-xl animate-fade-up text-[16px] leading-relaxed text-ink/70 [animation-delay:240ms]">{lede}</p>
      )}
    </header>
  );
}
