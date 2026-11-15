import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  outputFileTracingExcludes: {
    "/*": ["./.env*", "./.deployment/**/*", "./.runtime/**/*", "./data/**/*", "./tests/**/*", "./docs/**/*", "./.git/**/*"],
  },
};

export default nextConfig;
