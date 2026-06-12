import type { Metadata } from "next";
import { TrustPage } from "@/components/trust-page";

export const metadata: Metadata = {
  title: "Terms of Use | Tradia",
  description: "Read the terms for using Tradia as a visitor, business owner, reviewer, or advertiser.",
  alternates: {
    canonical: "/terms"
  }
};

export default function TermsPage() {
  return (
    <TrustPage eyebrow="Terms" title="Terms of Use" intro="These terms explain the basic rules for using Tradia.">
      <p>Users must provide accurate account, business, contact, and verification information.</p>
      <p>Tradia may review, edit, reject, suspend, or remove listings, reviews, reports, media, or accounts that are misleading, abusive, unlawful, spammy, duplicated, or harmful to users.</p>
      <p>Business owners are responsible for the products, services, prices, offers, and claims shown on their profiles.</p>
      <p>Paid visibility plans improve profile features and placement, but they do not guarantee sales, leads, ranking, or approval of false information.</p>
      <p>By using Tradia, you agree to use the platform lawfully and respectfully.</p>
    </TrustPage>
  );
}
