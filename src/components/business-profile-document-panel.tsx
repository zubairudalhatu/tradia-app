"use client";

import { FileText, Trash2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_PROFILE_PDF_BYTES = 20 * 1024 * 1024;

type ProfileDocument = {
  id: string;
  url: string;
  title: string | null;
};

type BusinessProfileDocumentPanelProps = {
  businessId: string;
  businessName: string;
  planName: string;
  enabled: boolean;
  document?: ProfileDocument;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

type SignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  signature: string;
  error?: string;
};

type CloudinaryResponse = {
  secure_url?: string;
  public_id?: string;
  bytes?: number;
  format?: string;
  resource_type?: string;
  error?: { message?: string };
};

export function BusinessProfileDocumentPanel({
  businessId,
  businessName,
  planName,
  enabled,
  document,
  deleteAction
}: BusinessProfileDocumentPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];

    if (!file) {
      setStatus("error");
      setMessage("Choose a PDF company profile first.");
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      resetInput();
      setStatus("error");
      setMessage("Only PDF company profiles are accepted.");
      return;
    }

    if (file.size > MAX_PROFILE_PDF_BYTES) {
      resetInput();
      setStatus("error");
      setMessage("This PDF is larger than the approved 20 MB limit.");
      return;
    }

    setStatus("uploading");
    setMessage("Uploading your company profile securely...");

    try {
      const signResponse = await fetch(`/api/business-profile-document/${businessId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign" })
      });
      const signature = await signResponse.json() as SignatureResponse;

      if (!signResponse.ok) throw new Error(signature.error || "Unable to authorize this upload.");

      const uploadData = new FormData();
      uploadData.set("file", file);
      uploadData.set("api_key", signature.apiKey);
      uploadData.set("timestamp", String(signature.timestamp));
      uploadData.set("folder", signature.folder);
      uploadData.set("public_id", signature.publicId);
      uploadData.set("allowed_formats", "pdf");
      uploadData.set("signature", signature.signature);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/raw/upload`,
        { method: "POST", body: uploadData }
      );
      const uploaded = await cloudinaryResponse.json() as CloudinaryResponse;

      if (!cloudinaryResponse.ok || !uploaded.secure_url || !uploaded.public_id) {
        throw new Error(uploaded.error?.message || "Cloudinary could not store this PDF.");
      }

      const completeResponse = await fetch(`/api/business-profile-document/${businessId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          bytes: uploaded.bytes,
          format: uploaded.format,
          resourceType: uploaded.resource_type,
          originalName: file.name
        })
      });
      const completed = await completeResponse.json() as { error?: string };

      if (!completeResponse.ok) throw new Error(completed.error || "Unable to attach the PDF to this profile.");

      resetInput();
      setStatus("success");
      setMessage("Company profile uploaded. Visitors can now open it from this business page.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The PDF could not be uploaded.");
    }
  }

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="border-t border-slate-200 bg-slate-50 px-4 py-5 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex min-w-0 gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-tradia bg-emerald-100 text-forest">
            <FileText size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-ember">Company profile PDF</p>
            <h2 className="mt-1 text-xl font-black text-ink">Give serious customers the full business story</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {enabled
                ? `Upload one public PDF for ${businessName}. Replacing it keeps the profile tidy.`
                : `This is a Platinum feature. ${planName} profiles can upgrade to add a downloadable company profile.`}
            </p>
          </div>
        </div>

        {enabled ? (
          <form onSubmit={uploadDocument} className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,280px)_auto] sm:items-center">
            <label className="min-w-0 cursor-pointer rounded-tradia border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-forest">
              <span className="flex items-center gap-2"><UploadCloud size={18} aria-hidden="true" /> Choose PDF, up to 20 MB</span>
              <input ref={inputRef} className="sr-only" type="file" accept="application/pdf,.pdf" required />
            </label>
            <button disabled={status === "uploading"} className="rounded-tradia bg-forest px-5 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:bg-slate-400">
              {status === "uploading" ? "Uploading..." : document ? "Replace PDF" : "Upload PDF"}
            </button>
          </form>
        ) : (
          <Link href="/pricing" className="inline-flex justify-center rounded-tradia bg-forest px-5 py-3 text-sm font-bold text-white">
            Compare Plans
          </Link>
        )}
      </div>

      {message ? (
        <p className={`mt-4 rounded-tradia px-4 py-3 text-sm font-bold ${status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-forest"}`} role={status === "error" ? "alert" : "status"}>
          {message}
        </p>
      ) : null}

      {document ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-tradia border border-slate-200 bg-white p-4">
          <a href={document.url} target="_blank" rel="noreferrer" className="min-w-0 font-bold text-forest hover:underline">
            {displayDocumentTitle(document.title)}
          </a>
          <form action={deleteAction}>
            <input type="hidden" name="mediaId" value={document.id} />
            <button className="inline-flex items-center gap-2 rounded-tradia bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              <Trash2 size={15} aria-hidden="true" /> Remove PDF
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function displayDocumentTitle(title: string | null) {
  return title?.replace(/^Company profile:\s*/i, "") || "Open company profile PDF";
}
