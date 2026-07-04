import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.kakaocdn.net" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "jumjuhub.com"],
    },
  },
};

export default nextConfig;
