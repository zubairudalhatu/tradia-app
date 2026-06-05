"use client";

import { Check, Copy, Download, MessageCircle, QrCode, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

type BusinessGrowthToolsProps = {
  businessName: string;
  profileUrl: string;
  reviewUrl: string;
  isVerified: boolean;
};

export function BusinessGrowthTools({
  businessName,
  profileUrl,
  reviewUrl,
  isVerified
}: BusinessGrowthToolsProps) {
  const [copied, setCopied] = useState(false);
  const qrUrl = useMemo(() => {
    const params = new URLSearchParams({
      size: "360x360",
      margin: "16",
      data: profileUrl
    });

    return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
  }, [profileUrl]);
  const reviewShareUrl = `https://wa.me/?text=${encodeURIComponent(`Please review ${businessName} on Tradia: ${reviewUrl}`)}`;
  const profileShareUrl = `https://wa.me/?text=${encodeURIComponent(`View ${businessName}${isVerified ? ", verified by Tradia" : ""}: ${profileUrl}`)}`;

  async function copyProfileLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function downloadPoster() {
    const svg = buildPosterSvg({
      businessName,
      profileUrl,
      qrUrl,
      isVerified
    });
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${slugify(businessName)}-tradia-qr-poster.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="border-t border-slate-200 bg-emerald-50/60 p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase text-forest">Owner growth tools</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Promote this Tradia profile</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Share this public page with customers, request reviews, and print a QR poster for your shop,
            office, receipts, or social posts.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-tradia border border-emerald-100 bg-white p-3 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="h-20 w-20 rounded-tradia bg-white" src={qrUrl} alt={`${businessName} Tradia QR code`} />
          <div className="max-w-40 text-xs font-bold leading-5 text-slate-600">
            Scan to open the verified public profile.
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={copyProfileLink}
          className="inline-flex items-center justify-center gap-2 rounded-tradia bg-white px-4 py-3 text-sm font-black text-ink shadow-sm transition hover:border-forest/30 hover:text-forest"
        >
          {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          {copied ? "Copied" : "Copy profile link"}
        </button>
        <a
          href={profileShareUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-tradia bg-forest px-4 py-3 text-sm font-black text-white transition hover:bg-forest/90"
        >
          <Share2 size={18} aria-hidden="true" />
          Share on WhatsApp
        </a>
        <a
          href={reviewShareUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-tradia bg-ember px-4 py-3 text-sm font-black text-white transition hover:bg-ember/90"
        >
          <MessageCircle size={18} aria-hidden="true" />
          Request reviews
        </a>
        <button
          type="button"
          onClick={downloadPoster}
          className="inline-flex items-center justify-center gap-2 rounded-tradia bg-white px-4 py-3 text-sm font-black text-ink shadow-sm transition hover:border-forest/30 hover:text-forest"
        >
          <Download size={18} aria-hidden="true" />
          Download QR poster
        </button>
      </div>

      <a
        href={qrUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 text-sm font-black text-forest"
      >
        <QrCode size={16} aria-hidden="true" />
        Open QR code image
      </a>
    </section>
  );
}

function buildPosterSvg({
  businessName,
  profileUrl,
  qrUrl,
  isVerified
}: {
  businessName: string;
  profileUrl: string;
  qrUrl: string;
  isVerified: boolean;
}) {
  const title = escapeXml(businessName);
  const url = escapeXml(profileUrl);
  const badge = isVerified ? "Verified by Tradia" : "Listed on Tradia";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#f8fafc"/>
  <rect x="80" y="80" width="920" height="1190" rx="32" fill="#ffffff" stroke="#dbe4ef" stroke-width="4"/>
  <text x="540" y="190" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900" fill="#071d36">TRADIA</text>
  <text x="540" y="255" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#047857">${badge}</text>
  <text x="540" y="380" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="900" fill="#071d36">${title}</text>
  <rect x="280" y="465" width="520" height="520" rx="20" fill="#ffffff" stroke="#dbe4ef" stroke-width="4"/>
  <image href="${escapeXml(qrUrl)}" x="320" y="505" width="440" height="440"/>
  <text x="540" y="1065" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#071d36">Scan to view this business profile</text>
  <text x="540" y="1130" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#64748b">${url}</text>
  <text x="540" y="1220" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" fill="#047857">www.tradia.business</text>
</svg>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "business";
}
