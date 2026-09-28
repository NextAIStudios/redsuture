import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.e2b.app', 'localhost:3333', '127.0.0.1:3333'],
};

export default nextConfig;
