import { NextResponse } from "next/server";
import { ALL_SESSION_COOKIES, clearSession } from "@/lib/auth/session";

export async function GET() {
  await clearSession();
  const response = new NextResponse(logoutHtml(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Clear-Site-Data": "\"cookies\", \"storage\""
    }
  });

  for (const name of ALL_SESSION_COOKIES) {
    for (const domain of [undefined, ".tradia.business", "tradia.business", "www.tradia.business"]) {
      response.headers.append("Set-Cookie", expireCookieHeader(name, domain));
    }
  }

  return response;
}

function logoutHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="1; url=/login?loggedOut=1" />
    <title>Signing out | Tradia</title>
    <script>
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      setTimeout(function () {
        window.location.replace("/login?loggedOut=1");
      }, 300);
    </script>
  </head>
  <body style="font-family: Arial, sans-serif; color: #071d36; padding: 32px;">
    <h1>Signing you out...</h1>
    <p>You will be redirected shortly.</p>
    <p><a href="/login?loggedOut=1">Continue to login</a></p>
  </body>
</html>`;
}

function expireCookieHeader(name: string, domain?: string) {
  const domainAttribute = domain ? `; Domain=${domain}` : "";
  const secureAttribute = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax${secureAttribute}${domainAttribute}`;
}
