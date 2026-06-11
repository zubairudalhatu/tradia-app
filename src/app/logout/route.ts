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
    for (const domain of [
      undefined,
      ".tradiabusiness.com",
      "tradiabusiness.com",
      "www.tradiabusiness.com",
      ".tradia.business",
      "tradia.business",
      "www.tradia.business"
    ]) {
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
    <style>
      :root {
        color-scheme: light;
        --ink: #071d36;
        --forest: #047857;
        --paper: #f8fafc;
        --line: #dbe4ef;
        --muted: #64748b;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: var(--paper);
        color: var(--ink);
        font-family: Arial, Helvetica, sans-serif;
      }

      main {
        display: grid;
        min-height: 100vh;
        place-items: center;
        padding: 24px;
      }

      .panel {
        width: min(100%, 460px);
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        padding: 32px;
        box-shadow: 0 18px 45px rgba(7, 29, 54, 0.08);
      }

      .logo {
        display: block;
        width: 170px;
        height: auto;
      }

      .status {
        margin-top: 28px;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        border-radius: 999px;
        background: #ecfdf5;
        padding: 8px 12px;
        color: var(--forest);
        font-size: 13px;
        font-weight: 800;
      }

      .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(4, 120, 87, 0.25);
        border-top-color: var(--forest);
        border-radius: 999px;
        animation: spin 0.8s linear infinite;
      }

      h1 {
        margin: 18px 0 0;
        font-size: 34px;
        line-height: 1.08;
        letter-spacing: 0;
      }

      p {
        margin: 14px 0 0;
        color: var(--muted);
        font-size: 16px;
        line-height: 1.6;
      }

      a {
        margin-top: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        border-radius: 8px;
        background: var(--forest);
        padding: 0 18px;
        color: #ffffff;
        font-size: 14px;
        font-weight: 800;
        text-decoration: none;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>
    <script>
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      setTimeout(function () {
        window.location.replace("/login?loggedOut=1");
      }, 900);
    </script>
  </head>
  <body>
    <main>
      <section class="panel" aria-labelledby="logout-title">
        <img class="logo" src="/brand/tradia-logo.png" alt="Tradia" />
        <div class="status">
          <span class="spinner" aria-hidden="true"></span>
          Clearing secure session
        </div>
        <h1 id="logout-title">Signing you out...</h1>
        <p>Tradia is clearing this browser session before returning you to the login page.</p>
        <a href="/login?loggedOut=1">Continue to login</a>
      </section>
    </main>
  </body>
</html>`;
}

function expireCookieHeader(name: string, domain?: string) {
  const domainAttribute = domain ? `; Domain=${domain}` : "";
  const secureAttribute = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax${secureAttribute}${domainAttribute}`;
}
