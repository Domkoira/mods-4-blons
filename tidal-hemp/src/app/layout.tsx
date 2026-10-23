import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "./globals.css";
import { site } from "@/config/site";
import { AccessProvider } from "@/context/AccessContext";
import { CartProvider } from "@/context/CartContext";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccessGate } from "@/components/access/AccessGate";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    images: ["/images/hero-tide.jpg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F3EE",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-ink focus:px-4 focus:py-3 focus:text-xs focus:uppercase focus:tracking-widest focus:text-ivory"
        >
          Skip to content
        </a>
        <AccessProvider>
          <CartProvider>
            <AnnouncementBar />
            <Header />
            <main id="main">{children}</main>
            <Footer />
            <CartDrawer />
            <AccessGate />
          </CartProvider>
        </AccessProvider>
      </body>
    </html>
  );
}
