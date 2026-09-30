import type { NextConfig } from "next";

if (!process.env.BACKEND_URL) throw new Error("BACKEND_URL is required");
if (!process.env.HYDRA_PUBLIC_URL)
  throw new Error("HYDRA_PUBLIC_URL is required");
if (!process.env.OAUTH_CLIENT_ID)
  throw new Error("OAUTH_CLIENT_ID is required");
if (!process.env.OAUTH_REDIRECT_URI)
  throw new Error("OAUTH_REDIRECT_URI is required");

const nextConfig: NextConfig = {};

export default nextConfig;
