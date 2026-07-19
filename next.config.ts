import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // GitHub Pages 배포 시 basePath가 적용되며, static HTML export를 사용합니다.
  output: basePath ? "export" : undefined,

  // GitHub Pages 배포 시 도메인 주소(https://bloodstrawberry.github.io/puzznic)의 서브경로를 지원합니다.
  basePath: basePath || undefined,

  // static HTML export 시 내장 이미지 최적화 API를 무시합니다.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;