"use client";

import React, { useEffect, useRef, useState } from "react";
import { TossAds } from "@apps-in-toss/web-framework";

export function TossBannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isAdSupported = false;
    try {
      isAdSupported = TossAds.initialize.isSupported();
    } catch {
      // Ignored: TossAds is not supported in standard browsers
    }

    try {
      if (!isAdSupported) {
        console.warn("Toss Ads is not supported in this environment.");
        setTimeout(() => setIsSupported(false), 0);
        return;
      }
      setTimeout(() => setIsSupported(true), 0);

      TossAds.initialize({
        callbacks: {
          onInitialized: () => {
            console.log("Toss Ads SDK initialized successfully");
            setIsInitialized(true);
          },
          onInitializationFailed: (error: Error) => {
            console.error("Toss Ads SDK initialization failed:", error);
            setIsSupported(false);
          },
        },
      });
    } catch (err) {
      console.error("Error initializing Toss Ads SDK:", err);
      setTimeout(() => setIsSupported(false), 0);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized || !isSupported || !containerRef.current) {
      return;
    }

    const adGroupId = "ait-ad-test-banner-id";
    let attached: { destroy: () => void } | undefined;

    try {
      attached = TossAds.attachBanner(adGroupId, containerRef.current, {
        theme: "auto",
        tone: "blackAndWhite",
        variant: "expanded",
        callbacks: {
          onAdRendered: (payload) => {
            console.log("Ad rendered:", payload.slotId);
          },
          onAdFailedToRender: (payload) => {
            console.error("Ad failed to render:", payload.error.message);
            setIsSupported(false);
          },
        },
      });
    } catch (err) {
      console.error("Error attaching Toss Banner Ad:", err);
      setTimeout(() => setIsSupported(false), 0);
    }

    return () => {
      if (attached) {
        try {
          attached.destroy();
        } catch (err) {
          console.error("Error destroying Toss Banner Ad:", err);
        }
      }
    };
  }, [isInitialized, isSupported]);

  // If the environment is not supported, or initialization/rendering fails, show the dummy ad banner
  if (isSupported === false) {
    return (
      <div className="w-full flex items-center justify-center px-2 py-1 bg-[#0f0f10]">
        <div className="w-full max-w-6xl bg-[#17171c]/90 border border-zinc-900 rounded-[16px] px-3.5 py-2 flex items-center justify-between shadow-md relative overflow-hidden select-none animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm flex-shrink-0">
              💙
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">
                Toss Bank (더미 광고)
              </span>
              <span className="text-[10px] text-zinc-300 font-bold leading-snug truncate">
                지금 토스뱅크에서 매일 남은 이자를 받으세요
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 z-10">
            <a
              href="https://toss.im"
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-[9px] rounded-lg transition-all"
            >
              보기
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Display container for the real banner ad (uses inline auto-sizing mode)
  return (
    <div
      ref={containerRef}
      style={{ width: "100%" }}
      className="bg-transparent"
    />
  );
}
