import type { NextConfig } from "next";

// 로컬 개발/테스트 시에는 basePath를 완전히 비워둡니다.
// const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Always use static HTML export because apps-in-toss framework requires CSR/SSG only.
  output: "export",

  // 각 라우트 경로 끝에 '/'를 붙여 정적 파일 경로 매핑을 원활하게 함
  trailingSlash: true,

  // 로컬 테스트 시 주석 처리 (GitHub Pages 배포할 때만 다시 켜주세요)
  // basePath: basePath || undefined,

  // static HTML export 시 내장 이미지 최적화 API를 무시합니다.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;