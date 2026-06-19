import type { Metadata } from "next";
import { TrustPage } from "@/components/trust-page";

export const metadata: Metadata = {
  title: "Verification Policy | Tradia",
  description: "Understand how Tradia reviews business verification requests and proof documents.",
  alternates: {
    canonical: "/verification-policy"
  }
};

export default function VerificationPolicyPage() {
  return (
    <TrustPage
      eyebrow="Verification"
      title="Business Verification Policy"
      intro="Verification helps customers identify businesses that have submitted supporting proof for admin review."
    >
      <h2>Who can request verification</h2>
      <p>An eligible business owner or authorised representative may submit a verification request from the business dashboard. Plan eligibility allows a request to be reviewed; it does not guarantee approval.</p>

      <h2>Evidence we may review</h2>
      <p>Useful evidence can include CAC records, licences, storefront or workplace photos, utility documents, owner identification, official contact channels, or other proof connecting the requester to the business.</p>
      <ul>
        <li>Evidence should be readable, current, and relevant to the listed business.</li>
        <li>Names, locations, and ownership details should reasonably match the profile.</li>
        <li>Sensitive information should only be submitted through Tradia’s designated verification workflow.</li>
      </ul>

      <h2>How review works</h2>
      <p>Tradia admins compare the listing, account, and submitted evidence. A request may be approved, rejected, or held while additional clarification is requested. Review timing can vary with evidence quality and request volume.</p>

      <h2>What the badge means</h2>
      <p>A verified badge means Tradia reviewed available supporting proof at the time of approval. It does not guarantee the quality, safety, pricing, legality, financial standing, or future performance of a business.</p>

      <h2>Revocation and disputes</h2>
      <p>Verification may be removed when information becomes outdated, misleading, disputed, transferred, or inconsistent with platform standards. Businesses may send relevant corrections or disputes through the <a href="/contact">support centre</a>.</p>
    </TrustPage>
  );
}
