import type { NextConfig } from "next";
import path from "path";

const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET ?? "";
const s3Region = process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1";

const nextConfig: NextConfig = {
  // Pin workspace root so Turbopack does not infer the wrong directory from unrelated lockfiles
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  images: {
    remotePatterns: [
      ...(s3Bucket
        ? [
            {
              protocol: "https" as const,
              hostname: `${s3Bucket}.s3.${s3Region}.amazonaws.com`,
              pathname: "/**",
            },
            {
              protocol: "https" as const,
              hostname: `s3.${s3Region}.amazonaws.com`,
              pathname: `/${s3Bucket}/**`,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
