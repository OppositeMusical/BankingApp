import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root. Without this, Next walks up the filesystem, finds
  // an unrelated lockfile in a parent directory, and warns about ambiguity.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
