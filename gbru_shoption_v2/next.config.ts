import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "shoptioncdnsa.blob.core.windows.net",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },

  env: {
    NEXT_PUBLIC_ANALYTICS_API_KEY: process.env.NEXT_PUBLIC_ANALYTICS_API_KEY || process.env.VITE_ANALYTICS_API_KEY || "pk_live_bcd39b8924457c7be39983e0117dd57f",
    NEXT_PUBLIC_ANALYTICS_TRACK_URL: process.env.NEXT_PUBLIC_ANALYTICS_TRACK_URL || process.env.VITE_ANALYTICS_TRACK_URL || "https://shoption-usereng-api-hjdqfpfthqc2cxgd.centralindia-01.azurewebsites.net/api/events/track",
    VITE_ANALYTICS_API_KEY: process.env.VITE_ANALYTICS_API_KEY || process.env.NEXT_PUBLIC_ANALYTICS_API_KEY || "pk_live_bcd39b8924457c7be39983e0117dd57f",
    VITE_ANALYTICS_TRACK_URL: process.env.VITE_ANALYTICS_TRACK_URL || process.env.NEXT_PUBLIC_ANALYTICS_TRACK_URL || "https://shoption-usereng-api-hjdqfpfthqc2cxgd.centralindia-01.azurewebsites.net/api/events/track",
  },
};

export default nextConfig;