import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root. Without this, Next walks up the filesystem, finds
  // an unrelated lockfile in a parent directory, and warns about ambiguity.
  turbopack: {
    root: __dirname,
  },

  // Emit a self-contained server that carries only the packages actually
  // reached, so the runtime image doesn't ship node_modules whole. Required by
  // the Dockerfile's runtime stage, which copies .next/standalone.
  output: "standalone",
};

export default nextConfig;
