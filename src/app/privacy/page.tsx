import type { Metadata } from "next";
import { TrustPage } from "@/components/trust-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Tradia",
  description: "Learn how Tradia handles account, listing, verification, payment, review, and contact information.",
  alternates: {
    canonical: "/privacy"
  }
};

export default function PrivacyPage() {
  return (
    <TrustPage eyebrow="Privacy" title="Privacy Policy" intro="Tradia collects only the information needed to operate a trusted business directory.">
      <p>We collect account details, submitted business information, uploaded media or verification documents, reviews, reports, payments, and platform usage data.</p>
      <p>We use this information to operate accounts, publish listings, review verification requests, process subscriptions, prevent abuse, send notifications, and improve the platform.</p>
      <p>Public business information may appear on Tradia pages and search engines. Sensitive verification documents are reviewed for trust and safety workflows.</p>
      <p>We do not sell user personal information. Third-party services such as hosting, database, email, payments, and media storage are used to provide the service.</p>
      <p>For privacy enquiries, contact <a className="font-bold text-forest" href="mailto:tradia@zamkah.com.ng">tradia@zamkah.com.ng</a>.</p>
    </TrustPage>
  );
}
