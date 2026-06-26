import Constants from "expo-constants";

const DEFAULT_BASE_URL = "https://www.tradiabusiness.com";

export const tradiaBaseUrl = resolveBaseUrl();

export function appUrl(path = "") {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${tradiaBaseUrl}${safePath}`;
}

function resolveBaseUrl() {
  const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl;

  if (typeof configuredUrl !== "string" || !configuredUrl.trim()) {
    return DEFAULT_BASE_URL;
  }

  return configuredUrl.replace(/\/$/, "");
}
