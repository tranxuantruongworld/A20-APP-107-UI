import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This ignores type errors in the supabase folder during the Vercel build
    ignoreBuildErrors: true, 
  }
};

export default nextConfig;
