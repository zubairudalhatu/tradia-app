import type { Metadata } from "next";
import { TrustPage } from "@/components/trust-page";

export const metadata: Metadata = {
  title: "Refund Policy | Tradia",
  description: "Review Tradia's refund policy for subscriptions and paid visibility plans."
};

export default function RefundPolicyPage() {
  return (
    <TrustPage eyebrow="Refunds" title="Refund Policy" intro="This policy explains how Tradia handles refund requests for paid plans.">
      <p>Paid Tradia plans are annual visibility and listing-feature subscriptions for business profiles.</p>
      <p>Refund requests should be sent to <a className="font-bold text-forest" href="mailto:tradia@zamkah.com.ng">tradia@zamkah.com.ng</a> with the business name, payment reference, account email, and reason for the request.</p>
      <p>Refunds may be considered where there is duplicate payment, payment error, failed activation, or a clear billing mistake.</p>
      <p>Refunds are generally not guaranteed after a plan has been activated and used for visibility, verification eligibility, uploads, or featured placement benefits.</p>
      <p>Approved refunds are processed through the original payment channel where possible.</p>
    </TrustPage>
  );
}
