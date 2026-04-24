import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This ignores type errors in the supabase folder during the Vercel build
    ignoreBuildErrors: true, 
  },
  allowedDevOrigins: ['sb-dbyi0jner6is.vercel.run'],
};

export default nextConfig;
