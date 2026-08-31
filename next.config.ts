import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: process.env.NODE_ENV === "production" ? false : undefined,
};

export default nextConfig;
