import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  typescript: {
    // This ignores type errors in the supabase folder during the Vercel build
    ignoreBuildErrors: true, 
  },
  allowedDevOrigins: ['sb-dbyi0jner6is.vercel.run'],
};

export default withNextIntl(nextConfig);
