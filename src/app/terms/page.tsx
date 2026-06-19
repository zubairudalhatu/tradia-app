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
      <h2>Using Tradia</h2>
      <p>By accessing Tradia or creating an account, you agree to use the platform lawfully, respectfully, and in line with these terms. Users must provide accurate account, business, contact, and verification information.</p>

      <h2>Listings and owner responsibility</h2>
      <p>Business owners are responsible for the products, services, prices, offers, licences, contact details, and claims shown on their profiles. Listing a business does not create an employment, agency, partnership, or endorsement relationship with Tradia.</p>
      <ul>
        <li>Do not impersonate a business or claim ownership without authority.</li>
        <li>Do not upload unlawful, misleading, copied, harmful, or privacy-infringing content.</li>
        <li>Keep important business and contact information reasonably current.</li>
        <li>Respect customers, reviewers, other businesses, and Tradia staff.</li>
      </ul>

      <h2>Reviews, enquiries, and user content</h2>
      <p>Reviews and enquiries should reflect genuine experiences or questions. Tradia may moderate, restrict, or remove content that appears fraudulent, abusive, irrelevant, promotional, duplicated, or unsafe.</p>

      <h2>Paid plans and visibility</h2>
      <p>Paid plans and add-ons provide the features described at purchase. They may improve profile tools or placement but do not guarantee sales, leads, search ranking, customer decisions, or verification approval.</p>

      <h2>Moderation and account action</h2>
      <p>Tradia may review, edit, reject, suspend, restrict, or remove listings, reviews, reports, media, transactions, or accounts that breach these terms, create risk, misuse the platform, or require investigation.</p>

      <h2>Availability and changes</h2>
      <p>We work to keep Tradia available and accurate, but features may change and interruptions can occur. Material policy updates will be published on this page. Continued use after an update means the revised terms apply.</p>
    </TrustPage>
  );
}
