// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ビルド時に ESLint エラーで落とさない（Vercel も同様）
    ignoreDuringBuilds: true,
  },
  // 必要なら型エラーも無視（本当の最終手段）
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
};

export default nextConfig;
