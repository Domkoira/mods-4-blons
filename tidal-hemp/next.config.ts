import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Add your CDN / ecommerce image host here when real photography is connected.
    remotePatterns: [],
  },
};

export default nextConfig;
