import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Reduces memory usage during Webpack/Turbopack builds
    webpackMemoryOptimizations: true,
    // Runs the compiler in a separate worker to protect the main process
    webpackBuildWorker: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'commondatastorage.googleapis.com',
      },
    ],
  },
  // Disable source maps in production to save up to 30% RAM
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer }) => {
    // Partial Pruning: Exclude heavy video processing libraries from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "fluent-ffmpeg": false,
        "youtube-dl-exec": false,
        "child_process": false,
        "fs": false,
      };
    }
    return config;
  },
};

export default nextConfig;
