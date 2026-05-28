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
      <p>
        Social media: <span className="font-bold">X</span>, <span className="font-bold">Instagram</span>,{" "}
        <span className="font-bold">Facebook</span>, and <span className="font-bold">TikTok</span>{" "}
        <span className="font-bold text-forest">@tradiabusiness</span>
      </p>
      <p>Company: Zamkah Technologies Limited</p>
    </TrustPage>
  );
}
