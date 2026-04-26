import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com", pathname: "/**" },
      { protocol: "https", hostname: "g.espncdn.com", pathname: "/**" },
      { protocol: "https", hostname: "a1.espncdn.com", pathname: "/**" },
    ],
  },
  // Hosts allowed to request /_next/* dev resources (HMR etc.) when browsing
  // from another machine on the LAN (e.g. an Android phone hitting the dev
  // server at the PC's IP). Add new IPs here as needed.
  allowedDevOrigins: [
    "192.168.1.244",
    "192.168.*.*",   // home subnet (any phone/tablet)
    "100.64.1.244",
    "100.64.95.*",   // /24 over Tailscale / CGNAT range
  ],
};

export default nextConfig;
