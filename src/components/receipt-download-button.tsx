"use client";

import { Download } from "lucide-react";

export function ReceiptDownloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-tradia bg-forest px-4 py-2 text-sm font-bold text-white transition hover:bg-forest/90"
    >
      <Download size={16} aria-hidden="true" />
      Download / Print PDF
    </button>
  );
}
