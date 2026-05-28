import type { Metadata } from "next";
import { TrustPage } from "@/components/trust-page";

export const metadata: Metadata = {
  title: "Contact Tradia | Zamkah Technologies Limited",
  description: "Contact Tradia for business listing support, verification help, payments, and platform enquiries."
};

export default function ContactPage() {
  return (
    <TrustPage
      eyebrow="Contact"
      title="Contact Tradia"
      intro="Reach the Tradia team for listing, verification, billing, or partnership support."
    >
      <p>
        Email: <a className="font-bold text-forest" href="mailto:tradia@zamkah.com.ng">tradia@zamkah.com.ng</a>
      </p>
      <p>
        WhatsApp: <a className="font-bold text-forest" href="https://wa.me/2349055091300">+234 905 509 1300</a>
      </p>
      <p>Social media: <span className="font-bold">@tradiabusiness</span> on X, Instagram, Facebook, and TikTok.</p>
      <p>Company: Zamkah Technologies Limited</p>
    </TrustPage>
  );
}
