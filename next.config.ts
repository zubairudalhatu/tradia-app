import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "tradia.business" }],
        destination: "https://www.tradiabusiness.com/:path*",
        permanent: true
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.tradia.business" }],
        destination: "https://www.tradiabusiness.com/:path*",
        permanent: true
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "tradiabusiness.com" }],
        destination: "https://www.tradiabusiness.com/:path*",
        permanent: true
      }
    ];
  },
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://partner.googleadservices.com https://www.googletagservices.com https://*.googlesyndication.com https://*.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "media-src 'self' https:",
      "frame-src 'self' https://googleads.g.doubleclick.net https://*.doubleclick.net https://*.googlesyndication.com https://*.google.com",
      "worker-src 'self' blob:"
    ].join("; ");

    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: contentSecurityPolicy
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff"
      },
      {
        key: "X-Frame-Options",
        value: "DENY"
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin"
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(self)"
      }
    ];
    const publicCacheHeader = {
      key: "Cache-Control",
      value: "public, s-maxage=300, stale-while-revalidate=86400"
    };

    return [
      {
        source: "/:path*",
        headers: securityHeaders
      },
      {
        source: "/",
        headers: [publicCacheHeader]
      },
      {
        source: "/businesses",
        headers: [publicCacheHeader]
      },
      {
        source: "/categories/:path*",
        headers: [publicCacheHeader]
      },
      {
        source: "/locations/:path*",
        headers: [publicCacheHeader]
      }
    ];
  }
};

export default nextConfig;
