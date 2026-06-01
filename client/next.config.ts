import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin workspace root so Turbopack does not infer the wrong directory from unrelated lockfiles
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
