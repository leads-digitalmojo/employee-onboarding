import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploaded signatures are base64 PNGs; give route handlers room to breathe.
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  // firebase-admin pulls in gRPC native bindings that don't play well with
  // webpack's bundler — run it as a plain Node require instead of bundling it.
  serverExternalPackages: ["firebase-admin"],
  // Chrome's default COOP (same-origin) blocks Firebase Auth's
  // signInWithPopup from detecting when the Google sign-in popup closes.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
