import type { Metadata } from "next";
import { SupportShell } from "@/components/support-shell";

export const metadata: Metadata = {
  title: "Knowledge Base | Support",
  description: "Answers to common questions about Tradia listings, verification, reviews, plans, payments, and accounts.",
  alternates: { canonical: "/support/knowledge-base" }
};

const questions = [
  ["Is it free to list a business?", "Yes. Tradia offers a free listing option. Paid plans add benefits such as more media capacity, analytics, visibility options, and verification eligibility."],
  ["Does a paid plan automatically verify my business?", "No. Eligible plans allow a business to request verification review. Tradia still reviews the submitted information and supporting proof before approving verification."],
  ["How do I update my logo or cover image?", "Sign in as the business owner and open the public business profile. Use the camera control on the logo or Edit cover on the cover image."],
  ["Why is my business not published yet?", "New and updated listings may require admin review. Make sure the profile contains accurate details and does not violate Tradia policies."],
  ["How do reviews work?", "Signed-in users can leave reviews. Business owners and visitors can report reviews that appear abusive, misleading, or unrelated to a genuine experience."],
  ["How do I report a listing?", "Open the business profile and use its Report listing section. This connects the report directly to the correct listing for admin review."],
  ["Where can I find receipts?", "Signed-in users can find payment and wallet activity in their account area. Available transactions include a downloadable receipt."],
  ["How do I contact Tradia?", "Use the Contact Us page for account, billing, verification, partnership, or technical support. Include the relevant business name and reference number when possible."]
];

export default function KnowledgeBasePage() {
  return (
    <SupportShell
      eyebrow="Knowledge Base"
      title="Answers to common Tradia questions"
      intro="Quick guidance about listings, verification, reviews, plans, payments, and account support."
    >
      <div className="grid gap-3">
        {questions.map(([question, answer]) => (
          <details key={question} className="group rounded-tradia border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer list-none pr-5 text-lg font-black text-ink marker:hidden">
              {question}
            </summary>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">{answer}</p>
          </details>
        ))}
      </div>
    </SupportShell>
  );
}
