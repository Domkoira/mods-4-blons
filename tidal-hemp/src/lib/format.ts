const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const formatPrice = (n: number) => currency.format(n);

export const formatDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
