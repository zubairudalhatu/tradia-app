import type { BusinessDetail, BusinessSummary, CategoryFilter, LocationGroup } from "./types";
import { appUrl } from "./config";

export type BusinessListFilters = {
  q?: string;
  category?: string;
  location?: string;
  verified?: boolean;
};

export async function listBusinesses(filters: BusinessListFilters = {}) {
  const params = new URLSearchParams({ limit: "50" });

  if (filters.q?.trim()) {
    params.set("q", filters.q.trim());
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.location) {
    params.set("location", filters.location);
  }

  if (filters.verified) {
    params.set("verified", "1");
  }

  const response = await fetch(appUrl(`/api/businesses?${params.toString()}`));

  if (!response.ok) {
    throw new Error("Unable to load businesses.");
  }

  const payload = await response.json() as { data: BusinessSummary[] };
  return payload.data;
}

export async function listCategories() {
  const response = await fetch(appUrl("/api/categories"));

  if (!response.ok) {
    throw new Error("Unable to load categories.");
  }

  const payload = await response.json() as { data: CategoryFilter[] };
  return payload.data;
}

export async function listLocations() {
  const response = await fetch(appUrl("/api/locations"));

  if (!response.ok) {
    throw new Error("Unable to load locations.");
  }

  const payload = await response.json() as { data: LocationGroup[] };
  return payload.data;
}

export async function getBusiness(slug: string) {
  const response = await fetch(appUrl(`/api/businesses/${encodeURIComponent(slug)}`));

  if (!response.ok) {
    throw new Error("Unable to load this business.");
  }

  const payload = await response.json() as { data: BusinessDetail };
  return payload.data;
}

export function businessUrl(slug: string) {
  return appUrl(`/businesses/${slug}`);
}

export function addBusinessUrl() {
  return appUrl("/businesses/new");
}

export function accountUrl() {
  return appUrl("/account");
}
