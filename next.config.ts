import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ponytail: baseline headers only. A CSP needs nonces for Next's inline scripts plus the Google
  // Fonts origins; add one if the app ever renders third-party content.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
