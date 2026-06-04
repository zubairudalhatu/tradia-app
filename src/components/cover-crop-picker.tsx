"use client";

import { useRef, useState } from "react";

type CoverCropPickerProps = {
  imageUrl: string;
  initialX: number;
  initialY: number;
};

export function CoverCropPicker({ imageUrl, initialX, initialY }: CoverCropPickerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState({
    x: clampCrop(initialX),
    y: clampCrop(initialY)
  });

  function updateFromPointer(clientX: number, clientY: number) {
    const frame = frameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setCrop({
      x: clampCrop(Math.round(x)),
      y: clampCrop(Math.round(y))
    });
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name="coverCropX" value={crop.x} />
      <input type="hidden" name="coverCropY" value={crop.y} />
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
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover select-none"
          draggable={false}
          style={{ objectPosition: `${crop.x}% ${crop.y}%` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.45)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.45)_1px,transparent_1px)] bg-[size:33.333%_33.333%]" />
        <span
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-forest shadow-lg"
          style={{ left: `${crop.x}%`, top: `${crop.y}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-600">
        <span>Drag the point to choose the visible cover focus.</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          Focus {crop.x}% / {crop.y}%
        </span>
      </div>
    </div>
  );
}

function clampCrop(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.min(Math.max(value, 0), 100);
}

