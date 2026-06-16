import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/api/generer",
        destination: "/api/generate",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
