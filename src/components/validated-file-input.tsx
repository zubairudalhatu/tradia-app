"use client";

import { useRef, useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type ValidatedFileInputProps = {
  name: string;
  accept: string;
  required?: boolean;
  className?: string;
};

export function ValidatedFileInput({ name, accept, required, className }: ValidatedFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function validateFile() {
    const file = inputRef.current?.files?.[0];

    if (file && file.size > MAX_FILE_SIZE) {
      if (inputRef.current) inputRef.current.value = "";
      setError("This file is larger than the approved 5 MB limit. Choose a smaller file.");
      return;
    }

    setError(null);
  }

  return (
    <>
      <input ref={inputRef} className={className} name={name} type="file" accept={accept} required={required} onChange={validateFile} />
      <span className="text-xs font-semibold text-slate-500">Maximum file size: 5 MB.</span>
      {error ? (
        <span className="rounded-tradia bg-red-50 px-3 py-2 text-sm font-bold text-red-700" role="alert">
          {error}
        </span>
      ) : null}
    </>
  );
}
