import Constants from "expo-constants";

const DEFAULT_BASE_URL = "https://www.tradiabusiness.com";

export const tradiaBaseUrl = resolveBaseUrl();
export const releaseInfo = resolveReleaseInfo();

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

function resolveReleaseInfo() {
  const release = Constants.expoConfig?.extra?.release;

  if (!release || typeof release !== "object") {
    return {
      type: "development",
      artifact: "development",
      profile: "local"
    };
  }

  const values = release as Record<string, unknown>;

  return {
    type: typeof values.type === "string" ? values.type : "development",
    artifact: typeof values.artifact === "string" ? values.artifact : "development",
    profile: typeof values.profile === "string" ? values.profile : "local"
  };
}
