import type { Customer, Order } from "@/lib/types";

/** FAQ content. Grouped so the FAQ page can render sections. */
export const faqs: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "Products",
    items: [
      {
        q: "What is hemp-derived THCA?",
        a: "THCA is a naturally occurring cannabinoid found in raw hemp. Our hemp products are compliant with the 2018 Farm Bill and contain less than 0.3% Δ9-THC on a dry-weight basis. Every batch is tested to confirm it.",
      },
      {
        q: "How do you choose what to carry?",
        a: "We work with a short list of producers we've visited, tested, and tasted. A product has to pass third-party testing, meet our own sensory standard, and arrive consistently before it carries the Tidal Hemp name.",
      },
      {
        q: "How should I store my products?",
        a: "Keep everything sealed, away from light and heat, and out of reach of children and pets. Our flower jars are UV-protective and nitrogen-sealed, so leaving them closed until you're ready keeps them fresh.",
      },
    ],
  },
  {
    group: "Testing & Quality",
    items: [
      {
        q: "Where can I find lab results?",
        a: "Every product page has a Lab Results section with a View COA button for the exact batch we're currently shipping. Signed-in customers can also find COAs for everything they've ordered under Lab Reports in their account.",
      },
      {
        q: "Who tests your products?",
        a: "Independent, ISO/IEC 17025-accredited laboratories. We test for potency, and depending on the product, terpenes, heavy metals, pesticides, residual solvents, microbials, and mycotoxins.",
      },
    ],
  },
  {
    group: "Orders & Shipping",
    items: [
      {
        q: "Do I need to be 21 to order?",
        a: "Yes. You must be 21 or older to purchase, and age is verified at checkout. An adult signature may be required on delivery.",
      },
      {
        q: "Where do you ship?",
        a: "We ship to states where hemp-derived products are permitted. If your address is in a restricted jurisdiction, checkout will let you know before you pay.",
      },
      {
        q: "How long does shipping take?",
        a: "Orders placed before 1pm PT on weekdays ship the same day. Most arrive in 2–5 business days in discreet, unbranded packaging.",
      },
      {
        q: "What is your return policy?",
        a: "For safety reasons we can't accept returns of opened products. If something arrives damaged or isn't right, email us within 14 days and we'll make it right.",
      },
    ],
  },
  {
    group: "Membership",
    items: [
      {
        q: "What are private releases?",
        a: "Small, limited batches that we make available to verified account holders first. Create an account to see them, along with batch information and member-only drops.",
      },
      {
        q: "What is the Tide community?",
        a: "An opt-in channel for early notice of new releases, limited batches, restocks, and offers. The website always remains the place to shop.",
      },
    ],
  },
];

/** Mock signed-in customer. Replace with your auth provider's session. */
export const mockCustomer: Customer = {
  firstName: "Jordan",
  lastName: "Reyes",
  email: "jordan@example.com",
  memberSince: "2026-03-14",
  tier: "Tide Member",
  shippingAddress: ["Jordan Reyes", "1280 Ocean Front Walk", "Venice, CA 90291"],
};

export const mockOrders: Order[] = [
  {
    id: "TH-10482",
    placedOn: "2026-10-18",
    status: "Shipped",
    tracking: { carrier: "UPS", number: "1Z 84V 2E0 03 4471 2209", url: "#" },
    lines: [
      { productId: "p_tidal_reserve", variantId: "v_tr_35g", quantity: 2, price: 42 },
      { productId: "p_afterglow", variantId: "v_ag_20", quantity: 1, price: 34 },
    ],
    total: 118,
  },
  {
    id: "TH-10217",
    placedOn: "2026-09-29",
    status: "Delivered",
    lines: [
      { productId: "p_deep_current", variantId: "v_dc_1", quantity: 1, price: 38 },
      { productId: "p_slack_water", variantId: "v_sw_1500", quantity: 1, price: 78 },
    ],
    total: 116,
  },
  {
    id: "TH-09854",
    placedOn: "2026-08-11",
    status: "Delivered",
    lines: [{ productId: "p_coastal_reserve", variantId: "v_cr_7g", quantity: 1, price: 58 }],
    total: 65.5,
  },
];

/** Long-form legal / policy pages. SUPPLIED BY BUSINESS — placeholder copy. */
export const legalPages: Record<string, { title: string; updated: string; body: string[] }> = {
  terms: {
    title: "Terms of Service",
    updated: "2026-10-01",
    body: [
      "These terms govern your use of tidalhemp.com and any purchase you make from Tidal Hemp. By using the site you agree to them.",
      "You must be at least 21 years of age to purchase from Tidal Hemp. By placing an order you confirm that you meet this requirement and that the products are legal where you live.",
      "Product descriptions, pricing and availability may change without notice. We reserve the right to refuse or cancel any order, including orders to restricted jurisdictions.",
      "This placeholder text should be replaced with terms reviewed by legal counsel.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "2026-10-01",
    body: [
      "We collect the information needed to process your order, verify your age, and — if you opt in — keep you informed about releases.",
      "We never sell your personal information. Payment details are handled by our payment processor and are never stored on our servers.",
      "This placeholder text should be replaced with a policy reviewed by legal counsel.",
    ],
  },
  "age-requirements": {
    title: "Age Requirements",
    updated: "2026-10-01",
    body: [
      "Tidal Hemp products are intended for adults 21 and older. Age is verified at checkout using a third-party verification service, and an adult signature may be required on delivery.",
      "Some states and localities impose additional restrictions on hemp-derived products. We do not ship to jurisdictions where our products are restricted.",
    ],
  },
  shipping: {
    title: "Shipping",
    updated: "2026-10-01",
    body: [
      "Orders over $75 ship free. Orders under $75 ship for a flat $7.50.",
      "Orders placed before 1pm PT on business days ship the same day. Most orders arrive in 2–5 business days.",
      "All orders ship in discreet, unbranded, odor-sealed packaging. An adult signature may be required.",
    ],
  },
  returns: {
    title: "Returns",
    updated: "2026-10-01",
    body: [
      "For safety reasons, we can't accept returns of opened products.",
      "If your order arrives damaged, incorrect, or not up to our standard, contact care@tidalhemp.com within 14 days of delivery and we'll replace it or issue a refund.",
    ],
  },
};
