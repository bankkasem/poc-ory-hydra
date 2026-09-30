import type { NextConfig } from "next";

if (!process.env.BACKEND_URL) throw new Error("BACKEND_URL is required");
if (!process.env.HYDRA_PUBLIC_URL)
  throw new Error("HYDRA_PUBLIC_URL is required");
if (!process.env.OAUTH_CLIENT_ID)
  throw new Error("OAUTH_CLIENT_ID is required");
if (!process.env.OAUTH_REDIRECT_URI)
  throw new Error("OAUTH_REDIRECT_URI is required");
if (!process.env.MEMBER_APP_URL) throw new Error("MEMBER_APP_URL is required");

const nextConfig: NextConfig = {};

if (!/^[0-9a-f]{64}$/i.test(process.env.OAUTH_COOKIE_SECRET ?? ""))
  throw new Error("OAUTH_COOKIE_SECRET must be a 32-byte hex key");

export default nextConfig;
