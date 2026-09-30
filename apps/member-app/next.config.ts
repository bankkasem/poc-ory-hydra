import type { NextConfig } from "next";

if (!process.env.BACKEND_URL) throw new Error("BACKEND_URL is required");

const nextConfig: NextConfig = {
  rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${process.env.BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
