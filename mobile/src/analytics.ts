import { appUrl } from "./config";

type MobileEventName =
  | "mobile_search_submitted"
  | "mobile_add_business_tap"
  | "mobile_account_open"
  | "mobile_open_full_profile";

type MobileEventProperties = Record<string, string | number | boolean | null | undefined>;

export function trackMobileEvent(name: MobileEventName, properties: MobileEventProperties = {}) {
  const payload = JSON.stringify({
    name,
    properties: Object.fromEntries(
      Object.entries(properties).filter(([, value]) => value !== undefined && value !== "")
    )
  });

  void fetch(appUrl("/api/mobile-events"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: payload
  }).catch(() => {
    // Analytics should never block browsing, search, or profile opening.
  });
}
