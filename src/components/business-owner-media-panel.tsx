"use client";

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
  const logoItems = media.filter((item) => item.type === "LOGO");
  const coverItems = media.filter((item) => item.type === "COVER");
  const galleryItems = media.filter((item) => item.type !== "LOGO" && item.type !== "COVER");

  return (
    <section className="border-t border-slate-200 bg-slate-50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-ember">Owner tools</p>
          <h2 className="mt-1 text-2xl font-black">Profile photos</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Update the logo and cover image from this public page. Cover uploads can be positioned before saving.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-600">
          {media.length} upload{media.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <form action={uploadAction} className="grid gap-4 rounded-tradia border border-slate-200 bg-white p-5 shadow-sm" encType="multipart/form-data">
          <input type="hidden" name="mediaType" value="LOGO" />
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img className="h-20 w-20 rounded-tradia border border-slate-200 object-contain p-2" src={logoUrl} alt={`${businessName} logo`} />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-tradia border border-slate-200 bg-slate-50 text-2xl font-black text-forest">
                {businessName.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-black">Logo</h3>
              <p className="mt-1 text-sm text-slate-600">Upload a square PNG, JPG, or WebP logo.</p>
            </div>
          </div>
          <input className="rounded-tradia border border-slate-200 px-4 py-3 text-sm" name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
          <button className="rounded-tradia bg-forest px-5 py-3 text-sm font-bold text-white">Save Logo</button>
        </form>

        <CoverUploadForm uploadAction={uploadAction} />
      </div>

      {coverUrl ? (
        <form action={cropAction} className="mt-5 grid gap-4 rounded-tradia border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="font-black">Adjust current cover position</h3>
            <p className="mt-1 text-sm text-slate-600">Drag the focus point and save when the public cover looks right.</p>
          </div>
          <CoverCropPicker imageUrl={coverUrl} initialX={coverCropX} initialY={coverCropY} />
          <button className="rounded-tradia bg-slate-900 px-5 py-3 text-sm font-bold text-white">Save Cover Position</button>
        </form>
      ) : null}

      {media.length ? (
        <div className="mt-5 rounded-tradia border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-black">Delete uploaded media</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...logoItems, ...coverItems, ...galleryItems].map((item) => (
              <div key={item.id} className="overflow-hidden rounded-tradia border border-slate-200 bg-slate-50">
                {isImageMedia(item.type) ? (
                  <img className="h-32 w-full object-cover" src={item.url} alt={`${businessName} ${mediaTypeLabel(item.type).toLowerCase()}`} />
                ) : (
                  <div className="grid h-32 place-items-center bg-slate-100 text-sm font-black text-slate-500">
                    {mediaTypeLabel(item.type)}
                  </div>
                )}
                <div className="grid gap-3 p-3">
                  <strong className="text-sm text-ink">{mediaTypeLabel(item.type)}</strong>
                  <form action={deleteAction}>
                    <input type="hidden" name="mediaId" value={item.id} />
                    <button className="w-full rounded-tradia bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CoverUploadForm({ uploadAction }: { uploadAction: (formData: FormData) => void | Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 50, y: 50 });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function updatePreview() {
    const file = inputRef.current?.files?.[0];

    if (previewUrl) URL.revokeObjectURL(previewUrl);
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
    <form action={uploadAction} className="grid gap-4 rounded-tradia border border-slate-200 bg-white p-5 shadow-sm" encType="multipart/form-data">
      <input type="hidden" name="mediaType" value="COVER" />
      <input type="hidden" name="coverCropX" value={crop.x} />
      <input type="hidden" name="coverCropY" value={crop.y} />
      <div>
        <h3 className="font-black">Cover photo</h3>
        <p className="mt-1 text-sm text-slate-600">Choose a wide image, then drag the focus point before saving.</p>
      </div>
      <input
        ref={inputRef}
        className="rounded-tradia border border-slate-200 px-4 py-3 text-sm"
        name="file"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        required
        onChange={updatePreview}
      />
      <div
        ref={frameRef}
        className="relative h-44 cursor-crosshair overflow-hidden rounded-tradia border border-slate-200 bg-slate-100"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 1) return;
          updateFromPointer(event.clientX, event.clientY);
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover select-none"
            draggable={false}
            style={{ objectPosition: `${crop.x}% ${crop.y}%` }}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm font-bold text-slate-500">Cover preview</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.45)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.45)_1px,transparent_1px)] bg-[size:33.333%_33.333%]" />
        <span
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-forest shadow-lg"
          style={{ left: `${crop.x}%`, top: `${crop.y}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-600">
        <span>Focus {crop.x}% / {crop.y}%</span>
        <button className="rounded-tradia bg-forest px-5 py-3 text-sm font-bold text-white">Save Cover</button>
      </div>
    </form>
  );
}

function isImageMedia(type: string) {
  return ["LOGO", "COVER", "GALLERY"].includes(type);
}

function mediaTypeLabel(type: string) {
  if (type === "LOGO") return "Logo";
  if (type === "COVER") return "Cover image";
  if (type === "GALLERY") return "Photo";
  if (type === "MENU") return "Menu";
  if (type === "BROCHURE") return "Brochure";
  if (type === "DOCUMENT") return "Document";
  return "File";
}

function clampCrop(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.min(Math.max(value, 0), 100);
}
