import type { Metadata } from "next";
import { TrustPage } from "@/components/trust-page";

export const metadata: Metadata = {
  title: "Verification Policy | Tradia",
  description: "Understand how Tradia reviews business verification requests and proof documents."
};

export default function VerificationPolicyPage() {
  return (
    <TrustPage
      eyebrow="Verification"
      title="Business Verification Policy"
      intro="Verification helps customers identify businesses that have submitted supporting proof for admin review."
    >
      <p>Business owners may submit documents such as CAC certificates, storefront photos, utility bills, owner ID, or other proof connected to the business.</p>
      <p>Tradia admins review submitted proof and may approve, reject, or request further clarification.</p>
      <p>A verified badge means Tradia reviewed available proof at the time of submission. It does not guarantee the quality, safety, pricing, legality, or performance of a business.</p>
      <p>Verification may be removed if information becomes outdated, misleading, disputed, or inconsistent with platform standards.</p>
    </TrustPage>
  );
}
