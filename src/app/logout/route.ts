import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

export async function GET() {
  await clearSession();
  const response = NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "https://www.tradia.business"));
  const expiredCookie = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    expires: new Date(0),
    path: "/"
  };

  for (const name of ["tradia_session", "tradia_session_host"]) {
    response.cookies.set(name, "", expiredCookie);
    response.cookies.set(name, "", { ...expiredCookie, domain: ".tradia.business" });
    response.cookies.set(name, "", { ...expiredCookie, domain: "tradia.business" });
    response.cookies.set(name, "", { ...expiredCookie, domain: "www.tradia.business" });
  }

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return response;
}
