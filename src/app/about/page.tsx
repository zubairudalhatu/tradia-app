import type { Metadata } from "next";
import { TrustPage } from "@/components/trust-page";

export const metadata: Metadata = {
  title: "About Tradia | Nigeria Business Directory",
  description: "Learn about Tradia, a Nigerian business directory helping SMEs build trust, visibility, reviews, and verified profiles.",
  alternates: {
    canonical: "/about"
  }
};

export default function AboutPage() {
  return (
    <TrustPage
      eyebrow="About"
      title="Helping Nigerian businesses become easier to find and trust"
      intro="Tradia is a business discovery platform for customers and SMEs across Nigeria."
    >
      <p>
        Tradia helps customers find useful businesses by category, location, verification status, reviews, and contact details.
        For business owners, Tradia provides a simple profile, media uploads, verification requests, visibility plans, and tools to manage listings.
      </p>
      <p>
        The platform is operated by Zamkah Technologies Limited and is being built around practical trust signals: real owner accounts,
        admin-reviewed listings, business verification, clear contact information, and moderated reviews.
      </p>
    </TrustPage>
  );
}
