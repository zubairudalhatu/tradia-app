"use client";

import { Building2, ExternalLink, LoaderCircle, SearchCheck } from "lucide-react";
import { useEffect, useId, useState } from "react";

type Suggestion = {
  id: string;
  name: string;
  slug: string | null;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "SUSPENDED";
  category: string;
  location: string;
  similarity: number;
};

export function BusinessNameSuggestions() {
  const inputId = useId();
  const listId = `${inputId}-suggestions`;
  const [name, setName] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkedName, setCheckedName] = useState("");

  useEffect(() => {
    const query = name.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setCheckedName("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/businesses/name-suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const payload = response.ok ? await response.json() as { data?: Suggestion[] } : { data: [] };
        setSuggestions(payload.data ?? []);
        setCheckedName(query);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
          setCheckedName(query);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [name]);

  return (
    <div className="relative grid gap-2 text-sm font-bold text-slate-600">
      <label htmlFor={inputId}>Business name</label>
      <div className="relative">
        <input
          id={inputId}
          className="w-full rounded-tradia border border-slate-200 px-4 py-3 pr-11"
          name="name"
          placeholder="Aisha Fashion House"
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-controls={listId}
          aria-expanded={suggestions.length > 0}
          autoComplete="organization"
          required
        />
        {loading ? (
          <LoaderCircle aria-label="Checking similar businesses" className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-forest" />
        ) : name.trim().length >= 3 && checkedName === name.trim() ? (
          <SearchCheck aria-label="Similar-name check completed" className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-forest" />
        ) : null}
      </div>

      {suggestions.length ? (
        <div id={listId} className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-tradia border border-amber-200 bg-white shadow-xl" role="listbox">
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
            <p className="font-black text-amber-900">Similar businesses already exist</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">Check these listings before submitting another business.</p>
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {suggestions.map((suggestion) => {
              const content = (
                <>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-tradia bg-slate-100 text-forest">
                    <Building2 aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-black text-ink">{suggestion.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{suggestion.category} - {suggestion.location}</span>
                  </span>
                  <span className="shrink-0 text-xs font-black text-slate-500">{statusLabel(suggestion.status)}</span>
                  {suggestion.slug ? <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-forest" /> : null}
                </>
              );

              return suggestion.slug ? (
                <a key={suggestion.id} href={`/businesses/${suggestion.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-tradia px-3 py-3 hover:bg-emerald-50" role="option">
                  {content}
                </a>
              ) : (
                <div key={suggestion.id} className="flex items-center gap-3 rounded-tradia px-3 py-3" role="option" aria-disabled="true">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      <span className="text-xs font-semibold text-slate-500">We will check published and pending listings for similar names.</span>
    </div>
  );
}

function statusLabel(status: Suggestion["status"]) {
  if (status === "PUBLISHED") return "Published";
  if (status === "PENDING_REVIEW") return "Under review";
  if (status === "SUSPENDED") return "Existing";
  return "Draft";
}
