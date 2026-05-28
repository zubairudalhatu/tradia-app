"use client";

import { useEffect } from "react";

type AdsenseSlotProps = {
  slot?: string;
  className?: string;
  format?: "auto" | "fluid";
  layout?: string;
  responsive?: boolean;
};

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT ?? "ca-pub-5482232753323076";

export function AdsenseSlot({
  slot,
  className = "",
  format = "auto",
  layout,
  responsive = true
}: AdsenseSlotProps) {
  useEffect(() => {
    if (!slot) return;

    try {
      const adsbygoogle = window.adsbygoogle ?? [];
      adsbygoogle.push({});
      window.adsbygoogle = adsbygoogle;
    } catch (error) {
      console.error("AdSense slot failed to load", error);
    }
  }, [slot]);

  if (!slot) return null;

  return (
    <section className={className} aria-label="Advertisement">
      <p className="mb-2 text-center text-xs font-bold uppercase tracking-normal text-slate-400">Advertisement</p>
      <ins
        className="adsbygoogle block min-h-24 w-full"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </section>
  );
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}
