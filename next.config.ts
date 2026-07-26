import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const pagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      basePath: pagesBasePath,
      assetPrefix: pagesBasePath,
      trailingSlash: true,
      images: {
        unoptimized: true,
      },
      typescript: {
        // The static dashboard does not import Cloudflare-only worker modules.
        // Vinext's normal build remains the authoritative full-project type check.
        ignoreBuildErrors: true,
      },
    }
  : {};

export default nextConfig;
