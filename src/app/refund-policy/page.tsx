import type { Metadata } from "next";
import { TrustPage } from "@/components/trust-page";

export const metadata: Metadata = {
  title: "Refund Policy | Tradia",
  description: "Review Tradia's refund policy for subscriptions and paid visibility plans.",
  alternates: {
    canonical: "/refund-policy"
  }
};

export default function RefundPolicyPage() {
  return (
    <TrustPage eyebrow="Refunds" title="Refund Policy" intro="This policy explains how Tradia handles refund requests for paid plans.">
      <h2>What this policy covers</h2>
      <p>This policy applies to Tradia subscriptions, wallet funding, visibility placements, and paid add-ons. Each service begins or becomes available according to the description shown at purchase.</p>

      <h2>When a refund may be considered</h2>
      <ul>
        <li>A duplicate charge for the same transaction.</li>
        <li>A confirmed payment error or incorrect amount.</li>
        <li>A paid service that failed to activate and could not be restored.</li>
        <li>A billing mistake attributable to Tradia or its payment workflow.</li>
      </ul>

      <h2>When refunds are generally unavailable</h2>
      <p>Refunds are generally not available after a subscription, featured placement, kit, or add-on has been activated, delivered, substantially used, or fulfilled. Verification eligibility is not a guarantee of verification approval.</p>

      <h2>How to request a review</h2>
      <p>Use the <a href="/contact">secure support form</a> and choose “Payment or wallet.” Include the account email, business name, amount, transaction reference, payment date, and a clear explanation. Do not submit card credentials or one-time passwords.</p>

      <h2>Review and payment timing</h2>
      <p>Tradia will review the transaction and may request additional evidence. Approved refunds are returned through the original payment channel where possible. Processing time after approval depends on the payment provider and recipient bank.</p>
    </TrustPage>
  );
}
