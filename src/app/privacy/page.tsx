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
      <h2>Information we collect</h2>
      <p>We collect information needed to operate Tradia, including account details, business information, contact details, uploaded media, verification documents, reviews, reports, support requests, payment records, and basic platform activity.</p>
      <ul>
        <li>Account data such as name, email, phone number, profile photo, and optional social links.</li>
        <li>Business data such as description, location, hours, contacts, photos, documents, and ownership information.</li>
        <li>Transaction and service records for subscriptions, wallet activity, and add-ons.</li>
        <li>Technical and safety information used to secure accounts, prevent abuse, and diagnose problems.</li>
      </ul>

      <h2>How information is used</h2>
      <p>Information is used to create and secure accounts, publish and manage listings, process verification and ownership claims, deliver paid services, respond to support requests, send service messages, moderate content, and improve Tradia.</p>

      <h2>Public information</h2>
      <p>Published business details, approved media, reviews, ratings, and verification status may appear publicly on Tradia and in search engines. Account passwords, private verification evidence, and internal moderation notes are not intended for public display.</p>

      <h2>Service providers and disclosure</h2>
      <p>Tradia uses trusted providers for hosting, databases, media storage, email, messaging, analytics, and payments. We share only the information required to provide those services or comply with lawful obligations. We do not sell personal information.</p>

      <h2>Retention, security, and choices</h2>
      <p>Records are retained while needed for accounts, transactions, trust and safety, dispute handling, or legal obligations. Reasonable technical and administrative safeguards are used, but no online service can promise absolute security.</p>
      <p>You may update available profile information through your account. For access, correction, deletion, or privacy questions, use the <a href="/contact">secure support form</a>.</p>
    </TrustPage>
  );
}
