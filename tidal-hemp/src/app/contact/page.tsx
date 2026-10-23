import type { Metadata } from "next";
import { site } from "@/config/site";
import { PageIntro } from "@/components/content/PageIntro";
import { ContactForm } from "@/components/content/ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageIntro eyebrow="Contact" title="We’re here" italic="to help." />
      <div className="container-x grid gap-16 pb-24 md:grid-cols-12 md:pb-32">
        <div className="space-y-10 md:col-span-4">
          {[
            ["Customer care", site.email],
            ["Hours", "Monday – Friday, 9am – 5pm PT"],
            ["Wholesale", "wholesale@tidalhemp.com"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="eyebrow text-mist">{k}</p>
              <p className="mt-2 text-[15px]">{v}</p>
            </div>
          ))}
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <ContactForm />
        </div>
      </div>
    </>
  );
}
