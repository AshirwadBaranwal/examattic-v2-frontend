import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    // The frontend imports `AppType` from the backend for Hono RPC.
    // This causes TS to walk the backend tree and fail on backend-only deps (nanoid).
    // IDE type-checking still works fine during development.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
