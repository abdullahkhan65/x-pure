import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins the workspace root explicitly — this machine has an unrelated lockfile in the
  // user's home directory that would otherwise make Next.js guess the wrong root.
  outputFileTracingRoot: path.join(__dirname),
  // Native/node-API packages must stay external to the server bundle.
  serverExternalPackages: ["@prisma/client", "@node-rs/argon2"],
};

export default nextConfig;
