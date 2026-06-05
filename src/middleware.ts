import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_DISCOVERY_CACHE = "public, s-maxage=300, stale-while-revalidate=86400";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (isPublicDiscoveryPath(request.nextUrl.pathname)) {
    response.headers.set("Cache-Control", PUBLIC_DISCOVERY_CACHE);
  }

  return response;
}

export const config = {
  matcher: ["/", "/businesses", "/categories/:path*", "/locations/:path*"]
};

function isPublicDiscoveryPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/businesses" ||
    pathname.startsWith("/categories/") ||
    pathname.startsWith("/locations/")
  );
}
