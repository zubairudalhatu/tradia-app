import type { Metadata } from "next";
import { SocialLinks } from "@/components/social-links";
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
      intro="Reach the Tradia team for listing, premium services, verification, billing, or partnership support."
    >
      <p>
        Email: <a className="font-bold text-forest" href="mailto:tradia@zamkah.com.ng">tradia@zamkah.com.ng</a>
      </p>
      <p>
        WhatsApp: <a className="font-bold text-forest" href="https://wa.me/2349055091300">+234 905 509 1300</a>
      </p>
      <div>
        <p className="font-bold text-ink">Social media</p>
        <SocialLinks className="mt-2 text-forest" showHandle />
      </div>
      <p>Company: Zamkah Technologies Limited</p>
    </TrustPage>
  );
}
