"use client";

import { Camera, ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CoverCropPicker } from "@/components/cover-crop-picker";

type MediaItem = {
  id: string;
  type: string;
  url: string;
};

type BusinessOwnerMediaPanelProps = {
  businessName: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  coverCropX: number;
  coverCropY: number;
  media: MediaItem[];
  uploadAction: (formData: FormData) => void | Promise<void>;
  cropAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

type EditorMode = "logo" | "cover" | null;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function BusinessOwnerMediaPanel({
  businessName,
  logoUrl,
  coverUrl,
  coverCropX,
  coverCropY,
  media,
  uploadAction,
  cropAction,
  deleteAction
}: BusinessOwnerMediaPanelProps) {
  const [mode, setMode] = useState<EditorMode>(null);
  const logoItem = media.find((item) => item.type === "LOGO" && item.url === logoUrl);
  const coverItem = media.find((item) => item.type === "COVER" && item.url === coverUrl);

  useEffect(() => {
    if (!mode) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMode(null);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [mode]);

  return (
    <>
      <button
        type="button"
        className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-tradia bg-white/95 px-4 py-2 text-sm font-black text-ink shadow-lg backdrop-blur transition hover:bg-white"
        onClick={() => setMode("cover")}
      >
        <Pencil size={16} aria-hidden="true" />
        Edit cover
      </button>
      <button
        type="button"
        className="group absolute bottom-5 left-5 z-30 h-24 w-24 rounded-tradia bg-ink/0 text-white transition hover:bg-ink/20 focus-visible:bg-ink/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="Edit business logo"
        onClick={() => setMode("logo")}
      >
        <span className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-ink/85 shadow-lg transition group-hover:bg-forest group-focus-visible:bg-forest">
          <Camera size={19} aria-hidden="true" />
        </span>
      </button>

      {mode ? (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-ink/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-editor-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setMode(null);
          }}
        >
          <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-tradia bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
              <div>
                <p className="text-xs font-black uppercase text-ember">Owner media tools</p>
                <h2 id="media-editor-title" className="mt-1 text-2xl font-black text-ink">
                  {mode === "logo" ? "Update business logo" : "Update cover photo"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {mode === "logo"
                    ? "Use a clear square logo so customers recognize your business."
                    : "Choose a wide image and position the visible area before saving."}
                </p>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-tradia bg-slate-100 text-ink"
                aria-label="Close media editor"
                onClick={() => setMode(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="p-5">
              {mode === "logo" ? (
                <LogoEditor
                  businessName={businessName}
                  logoUrl={logoUrl}
                  logoItem={logoItem}
                  uploadAction={uploadAction}
                  deleteAction={deleteAction}
                />
              ) : (
                <CoverEditor
                  coverUrl={coverUrl}
                  coverItem={coverItem}
                  coverCropX={coverCropX}
                  coverCropY={coverCropY}
                  uploadAction={uploadAction}
                  cropAction={cropAction}
                  deleteAction={deleteAction}
                />
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function LogoEditor({
  businessName,
  logoUrl,
  logoItem,
  uploadAction,
  deleteAction
}: {
  businessName: string;
  logoUrl?: string | null;
  logoItem?: MediaItem;
  uploadAction: BusinessOwnerMediaPanelProps["uploadAction"];
  deleteAction: BusinessOwnerMediaPanelProps["deleteAction"];
}) {
  return (
    <div className="grid gap-5 md:grid-cols-[180px_1fr]">
      <div className="grid aspect-square place-items-center overflow-hidden rounded-tradia border border-slate-200 bg-slate-50 p-4">
        {logoUrl ? (
          <img className="h-full w-full object-contain" src={logoUrl} alt={`${businessName} logo`} />
        ) : (
          <strong className="text-6xl text-forest">{businessName.charAt(0)}</strong>
        )}
      </div>
      <div>
        <form action={uploadAction} className="grid gap-4" encType="multipart/form-data">
          <input type="hidden" name="mediaType" value="LOGO" />
          <label className="grid cursor-pointer place-items-center gap-2 rounded-tradia border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-forest hover:bg-emerald-50">
            <ImagePlus className="text-forest" size={24} aria-hidden="true" />
            <strong className="text-ink">Choose a new logo</strong>
            <span className="text-xs text-slate-500">PNG, JPG, or WebP</span>
            <input className="sr-only" name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
          </label>
          <button className="rounded-tradia bg-forest px-5 py-3 text-sm font-bold text-white">Save New Logo</button>
        </form>
        {logoItem ? <DeleteMediaButton item={logoItem} label="Remove current logo" deleteAction={deleteAction} /> : null}
      </div>
    </div>
  );
}

function CoverEditor({
  coverUrl,
  coverItem,
  coverCropX,
  coverCropY,
  uploadAction,
  cropAction,
  deleteAction
}: {
  coverUrl?: string | null;
  coverItem?: MediaItem;
  coverCropX: number;
  coverCropY: number;
  uploadAction: BusinessOwnerMediaPanelProps["uploadAction"];
  cropAction: BusinessOwnerMediaPanelProps["cropAction"];
  deleteAction: BusinessOwnerMediaPanelProps["deleteAction"];
}) {
  return (
    <div className="grid gap-5">
      <CoverUploadForm uploadAction={uploadAction} />
      {coverUrl ? (
        <form action={cropAction} className="grid gap-4 border-t border-slate-200 pt-5">
          <div>
            <h3 className="font-black text-ink">Reposition current cover</h3>
            <p className="mt-1 text-sm text-slate-600">Drag the focus point until the important part is visible.</p>
          </div>
          <CoverCropPicker imageUrl={coverUrl} initialX={coverCropX} initialY={coverCropY} />
          <button className="rounded-tradia bg-slate-900 px-5 py-3 text-sm font-bold text-white">Save Cover Position</button>
        </form>
      ) : null}
      {coverItem ? <DeleteMediaButton item={coverItem} label="Remove current cover" deleteAction={deleteAction} /> : null}
    </div>
  );
}

function DeleteMediaButton({
  item,
  label,
  deleteAction
}: {
  item: MediaItem;
  label: string;
  deleteAction: BusinessOwnerMediaPanelProps["deleteAction"];
}) {
  return (
    <form action={deleteAction} className="mt-4">
      <input type="hidden" name="mediaId" value={item.id} />
      <button className="inline-flex items-center gap-2 rounded-tradia bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
        <Trash2 size={16} aria-hidden="true" />
        {label}
      </button>
    </form>
  );
}

function CoverUploadForm({ uploadAction }: { uploadAction: BusinessOwnerMediaPanelProps["uploadAction"] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 50, y: 50 });
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function updatePreview() {
    const file = inputRef.current?.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (file && file.size > MAX_IMAGE_SIZE) {
      if (inputRef.current) inputRef.current.value = "";
      setPreviewUrl(null);
      setFileError("This image is larger than 5 MB. Choose a smaller image and try again.");
      return;
    }

    setFileError(null);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    setCrop({ x: 50, y: 50 });
  }

  function updateFromPointer(clientX: number, clientY: number) {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    setCrop({
      x: clampCrop(Math.round(((clientX - rect.left) / rect.width) * 100)),
      y: clampCrop(Math.round(((clientY - rect.top) / rect.height) * 100))
    });
  }

  return (
    <form action={uploadAction} className="grid gap-4" encType="multipart/form-data">
      <input type="hidden" name="mediaType" value="COVER" />
      <input type="hidden" name="coverCropX" value={crop.x} />
      <input type="hidden" name="coverCropY" value={crop.y} />
      <label className="grid cursor-pointer place-items-center gap-2 rounded-tradia border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center transition hover:border-forest hover:bg-emerald-50">
        <ImagePlus className="text-forest" size={24} aria-hidden="true" />
        <strong className="text-ink">Choose a new cover photo</strong>
        <span className="text-xs text-slate-500">Wide PNG, JPG, or WebP images up to 5 MB work best</span>
        <input ref={inputRef} className="sr-only" name="file" type="file" accept="image/png,image/jpeg,image/webp" required onChange={updatePreview} />
      </label>
      {fileError ? (
        <p className="rounded-tradia bg-red-50 px-4 py-3 text-sm font-bold text-red-700" role="alert">
          {fileError}
        </p>
      ) : null}
      {previewUrl ? (
        <div
          ref={frameRef}
          className="relative h-56 cursor-crosshair overflow-hidden rounded-tradia border border-slate-200 bg-slate-100"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            updateFromPointer(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (event.buttons !== 1) return;
            updateFromPointer(event.clientX, event.clientY);
          }}
        >
          <img src={previewUrl} alt="" className="h-full w-full select-none object-cover" draggable={false} style={{ objectPosition: `${crop.x}% ${crop.y}%` }} />
          <span className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-forest shadow-lg" style={{ left: `${crop.x}%`, top: `${crop.y}%` }} />
        </div>
      ) : null}
      <button disabled={!previewUrl} className="rounded-tradia bg-forest px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
        Save New Cover
      </button>
    </form>
  );
}

function clampCrop(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.min(Math.max(value, 0), 100);
}
