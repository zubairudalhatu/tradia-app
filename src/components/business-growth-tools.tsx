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
  const titleLines = wrapPosterTitle(businessName)
    .map((line, index) => `<text x="540" y="${350 + index * 62}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900" fill="#071d36">${escapeXml(line)}</text>`)
    .join("\n  ");
  const badge = isVerified ? "VERIFIED BUSINESS" : "LISTED BUSINESS";
  const instruction = isVerified ? "Scan to view this verified profile" : "Scan to view this business profile";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="brandSweep" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#009b55"/>
      <stop offset="0.55" stop-color="#00856d"/>
      <stop offset="1" stop-color="#071d36"/>
    </linearGradient>
    <linearGradient id="warmSweep" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd21e"/>
      <stop offset="1" stop-color="#ff5b1a"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#071d36" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="1080" height="1350" fill="#edf6f1"/>
  <path d="M0 0H1080V250C875 310 680 282 525 218C340 142 176 126 0 190Z" fill="url(#brandSweep)"/>
  <path d="M0 1180C178 1112 325 1124 477 1195C650 1276 842 1270 1080 1170V1350H0Z" fill="#071d36"/>
  <path d="M0 1228C165 1158 320 1170 474 1235C650 1310 841 1304 1080 1215V1350H0Z" fill="url(#brandSweep)" opacity="0.9"/>
  <path d="M860 0H1080V310C1015 270 950 214 912 148C884 100 869 51 860 0Z" fill="url(#warmSweep)"/>
  <rect x="74" y="70" width="932" height="1200" rx="52" fill="#ffffff" stroke="#ffffff" stroke-width="8" filter="url(#shadow)"/>
  <rect x="74" y="70" width="932" height="178" rx="52" fill="#071d36"/>
  <rect x="74" y="196" width="932" height="52" fill="#071d36"/>
  <rect x="180" y="101" width="720" height="116" rx="30" fill="#ffffff"/>
  <image href="https://www.tradiabusiness.com/brand/tradia-logo.png" x="245" y="110" width="590" height="98" preserveAspectRatio="xMidYMid meet"/>
  <rect x="334" y="275" width="412" height="48" rx="24" fill="${isVerified ? "#e7f8ef" : "#fff5d9"}"/>
  <circle cx="368" cy="299" r="14" fill="${isVerified ? "#009b55" : "#ff8a18"}"/>
  <path d="M361 299L367 305L377 293" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="397" y="308" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="900" letter-spacing="1" fill="${isVerified ? "#047857" : "#b45309"}">${badge}</text>
  ${titleLines}
  <rect x="234" y="472" width="612" height="612" rx="44" fill="#ffffff" stroke="#d9e7e0" stroke-width="5" filter="url(#shadow)"/>
  <rect x="270" y="508" width="540" height="540" rx="26" fill="#ffffff"/>
  <image href="${escapeXml(qrUrl)}" x="305" y="543" width="470" height="470"/>
  <rect x="298" y="1098" width="484" height="64" rx="32" fill="#071d36"/>
  <text x="540" y="1140" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="900" fill="#ffffff">${instruction}</text>
  <text x="540" y="1208" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="800" fill="#047857">Open the camera on your phone and scan</text>
  <rect x="278" y="1242" width="524" height="60" rx="30" fill="#ffffff"/>
  <circle cx="322" cy="1272" r="18" fill="#00a95c"/>
  <path d="M313 1272H331M322 1263V1281" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
  <text x="356" y="1281" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="900" fill="#071d36">www.tradiabusiness.com</text>
</svg>`;
}

function wrapPosterTitle(value: string) {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > 28 && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 2);
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
