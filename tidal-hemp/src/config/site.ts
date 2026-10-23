/**
 * Brand, navigation and compliance settings in one place.
 * Copy marked "SUPPLIED BY BUSINESS" should be reviewed by counsel before launch.
 */

export const site = {
  name: "Tidal Hemp",
  tagline: "Premium hemp. Naturally elevated.",
  description:
    "Carefully selected hemp products made for people who care about quality, consistency, and what goes into every batch.",
  url: "https://tidalhemp.com",
  email: "care@tidalhemp.com",
  announcement: "Free shipping on qualifying orders · 21+ only",

  nav: [
    { label: "Shop", href: "/shop" },
    { label: "About", href: "/about" },
    { label: "Quality", href: "/quality" },
    { label: "FAQ", href: "/faq" },
  ],

  footer: {
    navigation: [
      { label: "Shop", href: "/shop" },
      { label: "About", href: "/about" },
      { label: "Quality", href: "/quality" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
    customer: [
      { label: "Account", href: "/account" },
      { label: "Orders", href: "/account#orders" },
      { label: "Shipping", href: "/legal/shipping" },
      { label: "Returns", href: "/legal/returns" },
    ],
    legal: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Age Requirements", href: "/legal/age-requirements" },
    ],
    social: [
      { label: "Instagram", href: "https://instagram.com" },
      { label: "TikTok", href: "https://tiktok.com" },
      { label: "Signal", href: "#signal" },
    ],
  },

  /** Official Signal community / channel link. Replace "#signal" when ready. */
  signalUrl: "#signal",

  shipping: {
    freeThreshold: 75,
    flatRate: 7.5,
  },

  compliance: {
    minimumAge: 21,
    /**
     * Routes where the age check is shown on arrival.
     * Informational pages (home, about, quality, FAQ, legal) stay open;
     * purchasing from anywhere still requires verification.
     */
    gatedRoutes: ["/shop", "/account", "/checkout", "/coa"],
    exitUrl: "https://www.google.com",
    /** SUPPLIED BY BUSINESS — placeholder disclaimer text. */
    disclaimer:
      "Products sold by Tidal Hemp contain less than 0.3% Δ9-THC on a dry-weight basis in accordance with the 2018 Farm Bill. These statements have not been evaluated by the Food and Drug Administration. Our products are not intended to diagnose, treat, cure, or prevent any disease. Consult a physician before use if you are pregnant, nursing, taking medication, or have a medical condition. Keep out of reach of children and pets. Do not drive or operate machinery after use. Products may cause a positive result on a drug test. Availability is subject to state and local law; we do not ship to jurisdictions where these products are restricted.",
  },
} as const;

export type NavItem = { label: string; href: string };
