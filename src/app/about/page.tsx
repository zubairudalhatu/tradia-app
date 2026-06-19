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
      <h2>What Tradia does</h2>
      <p>Tradia helps people discover Nigerian businesses by service, category, location, verification status, reviews, and useful contact details.</p>
      <p>Business owners can create a public profile, upload media, receive enquiries, collect reviews, request verification, and choose visibility tools that fit their growth stage.</p>

      <h2>Why we are building it</h2>
      <p>Many capable local businesses are difficult to find online or lack a credible place to show what they offer. Tradia gives those businesses a practical digital presence while helping customers compare options with better context.</p>
      <ul>
        <li>Make local businesses easier to discover.</li>
        <li>Give SMEs useful tools without making a paid plan compulsory.</li>
        <li>Use clear trust signals rather than unsupported claims.</li>
        <li>Create direct paths between customers and business owners.</li>
      </ul>

      <h2>How trust works on Tradia</h2>
      <p>Trust is built through real owner accounts, reviewed listings, clear contact information, moderated reviews, supporting business evidence, and visible verification status. A Tradia badge is one signal among several; customers should still make their own informed decisions.</p>

      <h2>Who operates Tradia</h2>
      <p>Tradia is operated by Zamkah Technologies Limited in Nigeria. Product, support, moderation, billing, and verification workflows are managed through the Tradia platform and support centre.</p>
    </TrustPage>
  );
}
