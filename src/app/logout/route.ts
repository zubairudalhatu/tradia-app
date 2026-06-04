import { NextResponse } from "next/server";
import { ALL_SESSION_COOKIES, clearSession } from "@/lib/auth/session";

export async function GET() {
  await clearSession();
  const response = NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "https://www.tradia.business"));

  for (const name of ALL_SESSION_COOKIES) {
    for (const domain of [undefined, ".tradia.business", "tradia.business", "www.tradia.business"]) {
      response.headers.append("Set-Cookie", expireCookieHeader(name, domain));
    }
  }

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return response;
}

function expireCookieHeader(name: string, domain?: string) {
  const domainAttribute = domain ? `; Domain=${domain}` : "";
  const secureAttribute = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax${secureAttribute}${domainAttribute}`;
}
