import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploaded signatures are base64 PNGs; give route handlers room to breathe.
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  // firebase-admin pulls in gRPC native bindings that don't play well with
  // webpack's bundler — run it as a plain Node require instead of bundling it.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
