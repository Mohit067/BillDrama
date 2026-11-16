import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * BillDrama runs entirely in the browser (no API routes, no server logic), so it is
   * exported as plain static files into `out/` — ideal for Cloudflare Pages.
   * Note: static export doesn't support next.config `headers()`; security and cache
   * headers live in `public/_headers`, which Cloudflare Pages reads natively.
   */
  output: "export",
};

export default nextConfig;
