import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  // GitHub Actions 환경에서 빌드 시 static HTML export를 사용합니다.
  output: isGithubActions ? "export" : undefined,
  
  // GitHub Pages 배포 시 도메인 주소(https://bloodstrawberry.github.io/puzznic)의 서브경로를 지원합니다.
  basePath: isGithubActions ? "/puzznic" : undefined,
  
  // static HTML export 시 내장 이미지 최적화 API를 무시합니다.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
