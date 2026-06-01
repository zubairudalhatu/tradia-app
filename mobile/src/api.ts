import type { BusinessDetail, BusinessSummary } from "./types";

const apiBaseUrl = "https://www.tradia.business";

export async function listBusinesses(query = "") {
  const params = new URLSearchParams({ limit: "50" });

  if (query.trim()) {
    params.set("q", query.trim());
  }

  const response = await fetch(`${apiBaseUrl}/api/businesses?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Unable to load businesses.");
  }

  const payload = await response.json() as { data: BusinessSummary[] };
  return payload.data;
}

export async function getBusiness(slug: string) {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${encodeURIComponent(slug)}`);

  if (!response.ok) {
    throw new Error("Unable to load this business.");
  }

  const payload = await response.json() as { data: BusinessDetail };
  return payload.data;
}

export function businessUrl(slug: string) {
  return `${apiBaseUrl}/businesses/${slug}`;
}

export function addBusinessUrl() {
  return `${apiBaseUrl}/businesses/new`;
}

export function accountUrl() {
  return `${apiBaseUrl}/account`;
}
