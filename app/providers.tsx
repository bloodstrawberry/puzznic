"use client";

import React, { useState, useEffect } from "react";
import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * 로컬 개발 환경(브라우저)에서 토스 앱 네이티브 브릿지가 없을 때
 * 기본 상수 핸들러를 설정하여 "is not a constant handler" 에러를 방지합니다.
 * 토스 앱 내에서는 이미 실제 값이 설정되어 있으므로 기존 값이 우선됩니다.
 */
function setupConstantHandlerFallbacks() {
  if (typeof window === "undefined") return;

  const fallbacks: Record<string, unknown> = {
    getSafeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    deploymentId: "",
    brandDisplayName: "",
    brandIcon: "",
    brandPrimaryColor: "#3182F6",
  };

  const win = window as unknown as Record<string, unknown>;
  const existing =
    (win.__CONSTANT_HANDLER_MAP as Record<string, unknown>) ?? {};
  win.__CONSTANT_HANDLER_MAP = { ...fallbacks, ...existing };
}

export function Providers({ children }: ProvidersProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setupConstantHandlerFallbacks();
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <TDSMobileAITProvider>
      {children}
    </TDSMobileAITProvider>
  );
}

