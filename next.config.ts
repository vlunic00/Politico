import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Preserve the request host so loopback 404 rewrites stay internal.
  skipProxyUrlNormalize: true,
  output: process.env.STANDALONE === "1" ? "standalone" : undefined,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
    ] }];
  },
};
export default nextConfig;
