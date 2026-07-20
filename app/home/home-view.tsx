"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IAP } from "@apps-in-toss/web-framework";
import type { IapProductListItem } from "@apps-in-toss/web-framework";
import realMap from "../level/real-map.json";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "primary" | "dark" | "danger";
  variant?: "fill" | "weak";
  display?: "full" | "inline";
  size?: "small" | "medium" | "large";
  loading?: boolean;
}

function Button({
  color = "primary",
  variant = "fill",
  display = "inline",
  size = "medium",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "font-semibold rounded-2xl transition-all flex items-center justify-center cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none";

  let sizeStyles = "px-4 py-2 text-sm";
  if (size === "large") sizeStyles = "px-5 py-3.5 text-base font-bold";
  if (size === "small") sizeStyles = "px-3 py-1.5 text-xs";

  const displayStyles = display === "full" ? "w-full" : "";

  let colorStyles = "";
  if (color === "primary") {
    colorStyles =
      variant === "fill"
        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
        : "bg-blue-600/10 hover:bg-blue-600/20 text-blue-400";
  } else if (color === "dark") {
    colorStyles =
      variant === "fill"
        ? "bg-zinc-800 hover:bg-zinc-700 text-white"
        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800";
  } else if (color === "danger") {
    colorStyles =
      variant === "fill"
        ? "bg-red-600 hover:bg-red-500 text-white"
        : "bg-red-600/10 hover:bg-red-600/20 text-red-400";
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles} ${displayStyles} ${colorStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
}

// Modern Volume/Mute Icons
const VolumeOnIcon = () => (
  <svg
    className="w-5 h-5 text-zinc-300"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.536 8.464a5 5 0 010 7.072M17.95 5.636a9 9 0 010 12.728M12 18.75l-3-3H6.75A2.25 2.25 0 014.5 13.5v-3a2.25 2.25 0 012.25-2.25H9l3-3v13.5z"
    />
  </svg>
);

const VolumeOffIcon = () => (
  <svg
    className="w-5 h-5 text-zinc-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.5 9H2.25A.75.75 0 001.5 9.75v4.5c0 .414.336.75.75.75h2.25l2.25 2.25V5.25z"
    />
  </svg>
);

// Modern Lock Icon
const LockIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <rect
      x="6"
      y="11"
      width="12"
      height="9"
      rx="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 11V7a4 4 0 118 0v4"
    />
  </svg>
);

// Chevron Right Icon for ListRow
const ChevronRightIcon = () => (
  <svg
    className="w-5 h-5 text-zinc-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

// Sound synthesizer using Web Audio API
const playSound = (
  type: "coin" | "select" | "start" | "error",
  muted: boolean,
) => {
  if (muted || typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "coin") {
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playTone(987.77, now, 0.12);
      playTone(1318.51, now + 0.08, 0.25);
    } else if (type === "select") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "start") {
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.07, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playTone(523.25, now, 0.08);
      playTone(659.25, now + 0.08, 0.08);
      playTone(783.99, now + 0.16, 0.08);
      playTone(1046.5, now + 0.24, 0.3);
    } else if (type === "error") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn("Audio Context blocked:", e);
  }
};

// Modern Glassmorphism-style Block Components
const RenderBlock = ({ type }: { type: string }) => {
  switch (type) {
    case "sphere":
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ff9eb5" />
              <stop offset="40%" stopColor="#ff4b72" />
              <stop offset="100%" stopColor="#991530" />
            </radialGradient>
          </defs>
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="url(#sphereGrad)"
            stroke="#ffffff"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
          <circle
            cx="15"
            cy="15"
            r="4"
            fill="#ffffff"
            fillOpacity="0.4"
            filter="blur(0.5px)"
          />
        </svg>
      );
    case "diamond":
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffea79" />
              <stop offset="50%" stopColor="#ffb800" />
              <stop offset="100%" stopColor="#b37100" />
            </linearGradient>
          </defs>
          <polygon
            points="20,3 37,20 20,37 3,20"
            fill="url(#goldGrad)"
            stroke="#ffffff"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
          <line
            x1="20"
            y1="3"
            x2="20"
            y2="37"
            stroke="#ffffff"
            strokeOpacity="0.25"
            strokeWidth="1"
          />
          <line
            x1="3"
            y1="20"
            x2="37"
            y2="20"
            stroke="#ffffff"
            strokeOpacity="0.25"
            strokeWidth="1"
          />
        </svg>
      );
    case "cube":
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="pinkGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3adff" />
              <stop offset="50%" stopColor="#d03bf2" />
              <stop offset="100%" stopColor="#6e0085" />
            </linearGradient>
          </defs>
          <rect
            x="4"
            y="4"
            width="32"
            height="32"
            rx="6"
            fill="url(#pinkGrad)"
            stroke="#ffffff"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
          <rect
            x="10"
            y="10"
            width="20"
            height="20"
            rx="3"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        </svg>
      );
    case "cone":
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7efff5" />
              <stop offset="60%" stopColor="#00d2d3" />
              <stop offset="100%" stopColor="#018b8c" />
            </linearGradient>
          </defs>
          <polygon
            points="20,3 37,35 3,35"
            fill="url(#cyanGrad)"
            stroke="#ffffff"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
          <line
            x1="20"
            y1="3"
            x2="20"
            y2="35"
            stroke="#ffffff"
            strokeOpacity="0.3"
            strokeWidth="1"
          />
        </svg>
      );
    case "star":
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <radialGradient id="silverGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#a3b1c6" />
              <stop offset="100%" stopColor="#5d6a7e" />
            </radialGradient>
          </defs>
          <polygon
            points="20,3 25,15 37,15 28,24 32,36 20,29 8,36 12,24 3,15 15,15"
            fill="url(#silverGrad)"
            stroke="#ffffff"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
        </svg>
      );
    case "cylinder":
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7fff7f" />
              <stop offset="50%" stopColor="#2ecc71" />
              <stop offset="100%" stopColor="#1e8449" />
            </linearGradient>
          </defs>
          <path
            d="M 7,12 A 13,5 0 0,0 33,12 L 33,29 A 13,5 0 0,1 7,29 Z"
            fill="url(#greenGrad)"
            stroke="#ffffff"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
          <ellipse
            cx="20"
            cy="12"
            rx="13"
            ry="5"
            fill="#a9dfbf"
            stroke="#ffffff"
            strokeOpacity="0.2"
            strokeWidth="1"
          />
        </svg>
      );
    default:
      return null;
  }
};

const blockTypes = ["sphere", "diamond", "cube", "cone", "star", "cylinder"];

export default function HomeView() {
  const router = useRouter();
  const [credits, setCredits] = useState<number>(0);
  const [menuIndex, setMenuIndex] = useState<number>(0);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showChargeModal, setShowChargeModal] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [isInserting, setIsInserting] = useState<boolean>(false);
  const [showStageSelect, setShowStageSelect] = useState<boolean>(false);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [maxUnlockedStage, setMaxUnlockedStage] = useState<number>(1);

  const [products, setProducts] = useState<IapProductListItem[]>([]);
  const [iapSupported, setIapSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("puzznic_max_unlocked");
      if (stored) {
        const val = parseInt(stored, 10);
        setTimeout(() => {
          setMaxUnlockedStage(val);
        }, 0);
      }
    }
  }, []);

  useEffect(() => {
    async function initIAP() {
      // 브라우저 환경에서는 네이티브 브릿지(ReactNativeWebView)가 없으므로 IAP 초기화를 건너뜁니다.
      if (
        typeof window === "undefined" ||
        !(window as unknown as Record<string, unknown>).ReactNativeWebView
      ) {
        return;
      }
      try {
        const response = await IAP.getProductItemList();
        if (response && response.products && response.products.length > 0) {
          setProducts(response.products);
          setIapSupported(true);

          // Restore pending orders
          try {
            const pending = await IAP.getPendingOrders();
            if (pending && pending.orders && pending.orders.length > 0) {
              for (const order of pending.orders) {
                let count = 1;
                const match = order.sku.match(/(\d+)개/);
                if (match) {
                  count = parseInt(match[1], 10);
                }
                setCredits((prev) => prev + count);
                playSound("coin", muted);

                await IAP.completeProductGrant({
                  params: { orderId: order.orderId },
                });
              }
            }
          } catch (pendingErr) {
            console.warn("Failed to restore pending orders:", pendingErr);
          }
        }
      } catch (e) {
        console.warn("IAP not supported or products failed to load:", e);
      }
    }
    initIAP();
  }, [muted]);

  const handleIapBuy = useCallback(
    (sku: string) => {
      setIsInserting(true);
      try {
        const cleanup = IAP.createOneTimePurchaseOrder({
          options: {
            sku,
            processProductGrant: async ({ orderId }) => {
              let count = 1;
              const product = products.find((p) => p.sku === sku);
              if (product) {
                const match = product.displayName.match(/(\d+)개/);
                if (match) {
                  count = parseInt(match[1], 10);
                }
              }
              setCredits((prev) => prev + count);
              playSound("coin", muted);

              try {
                await IAP.completeProductGrant({ params: { orderId } });
              } catch (err) {
                console.error("Failed to complete product grant:", err);
              }
              return true;
            },
          },
          onEvent: (event) => {
            if (event.type === "success") {
              setIsInserting(false);
              setShowChargeModal(false);
              cleanup();
            }
          },
          onError: (error) => {
            console.error("IAP error:", error);
            setIsInserting(false);
            cleanup();
          },
        });
      } catch (e) {
        console.error("Failed to initiate purchase:", e);
        setIsInserting(false);
      }
    },
    [products, muted],
  );

  const bgBlocks = [
    {
      type: "sphere",
      left: "8%",
      delay: "0s",
      duration: "18s",
      size: "w-8 h-8",
    },
    {
      type: "diamond",
      left: "22%",
      delay: "3s",
      duration: "20s",
      size: "w-7 h-7",
    },
    {
      type: "cube",
      left: "38%",
      delay: "6s",
      duration: "16s",
      size: "w-10 h-10",
    },
    {
      type: "cone",
      left: "58%",
      delay: "1s",
      duration: "22s",
      size: "w-9 h-9",
    },
    {
      type: "star",
      left: "74%",
      delay: "4s",
      duration: "19s",
      size: "w-10 h-10",
    },
    {
      type: "cylinder",
      left: "88%",
      delay: "7s",
      duration: "17s",
      size: "w-7 h-7",
    },
  ];

  const insertCoin = useCallback(() => {
    setIsInserting(true);
    playSound("coin", muted);
    setCredits((prev) => prev + 1);
    setTimeout(() => setIsInserting(false), 300);
  }, [muted]);

  const startGame = useCallback(
    (stageNum: number) => {
      if (credits > 0) {
        setCredits((prev) => prev - 1);
        playSound("start", muted);
        setTimeout(() => router.push(`/game?stage=${stageNum}`), 400);
      } else {
        // Free auto coin-insert effect for seamless mobile layout
        playSound("coin", muted);
        setCredits(1);
        setTimeout(() => {
          setCredits(0);
          playSound("start", muted);
          router.push(`/game?stage=${stageNum}`);
        }, 400);
      }
    },
    [credits, muted, router],
  );

  const handleStageSelect = useCallback(
    (idx: number) => {
      if (idx < maxUnlockedStage) {
        startGame(idx + 1);
      } else {
        playSound("error", muted);
      }
    },
    [maxUnlockedStage, startGame, muted],
  );

  const handleStageHover = useCallback(
    (idx: number) => {
      if (selectedStageIndex !== idx) {
        setSelectedStageIndex(idx);
        playSound("select", muted);
      }
    },
    [selectedStageIndex, muted],
  );

  const totalPages = Math.ceil(realMap.length / 20);
  const pageIndex = Math.floor(selectedStageIndex / 20);
  const currentLevels = realMap.slice(pageIndex * 20, (pageIndex + 1) * 20);

  const nextPage = useCallback(() => {
    if (pageIndex < totalPages - 1) {
      const nextIdx = (pageIndex + 1) * 20;
      setSelectedStageIndex(nextIdx);
      playSound("select", muted);
    }
  }, [pageIndex, totalPages, muted]);

  const prevPage = useCallback(() => {
    if (pageIndex > 0) {
      const prevIdx = (pageIndex - 1) * 20;
      setSelectedStageIndex(prevIdx);
      playSound("select", muted);
    }
  }, [pageIndex, muted]);

  const triggerMenuAction = useCallback(
    (index: number) => {
      if (index === 0) {
        playSound("select", muted);
        setShowStageSelect(true);
      } else if (index === 1) {
        playSound("start", muted);
        setTimeout(() => router.push("/editor"), 400);
      } else if (index === 2) {
        playSound("select", muted);
        setShowHowToPlay(true);
      }
    },
    [muted, router],
  );

  const handleMenuHover = useCallback(
    (index: number) => {
      if (menuIndex !== index) {
        setMenuIndex(index);
        playSound("select", muted);
      }
    },
    [menuIndex, muted],
  );

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showHowToPlay) {
        if (e.key === "Escape" || e.key === "Enter") {
          setShowHowToPlay(false);
          playSound("select", muted);
        }
        return;
      }
      if (showChargeModal) {
        if (e.key === "Escape" || e.key === "Enter") {
          setShowChargeModal(false);
          playSound("select", muted);
        }
        return;
      }

      if (showStageSelect) {
        if (e.key === "Escape") {
          e.preventDefault();
          setShowStageSelect(false);
          playSound("select", muted);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setSelectedStageIndex((prev) => {
            const nextIdx = prev - 1;
            if (nextIdx >= 0) {
              playSound("select", muted);
              return nextIdx;
            }
            return prev;
          });
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setSelectedStageIndex((prev) => {
            const nextIdx = prev + 1;
            if (nextIdx < realMap.length) {
              playSound("select", muted);
              return nextIdx;
            }
            return prev;
          });
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedStageIndex((prev) => {
            const nextIdx = prev - 5;
            if (nextIdx >= 0) {
              playSound("select", muted);
              return nextIdx;
            }
            return prev;
          });
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedStageIndex((prev) => {
            const nextIdx = prev + 5;
            if (nextIdx < realMap.length) {
              playSound("select", muted);
              return nextIdx;
            }
            return prev;
          });
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleStageSelect(selectedStageIndex);
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMenuIndex((prev) => (prev === 0 ? 2 : prev - 1));
        playSound("select", muted);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setMenuIndex((prev) => (prev === 2 ? 0 : prev + 1));
        playSound("select", muted);
      } else if (e.key === "Enter") {
        e.preventDefault();
        triggerMenuAction(menuIndex);
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        insertCoin();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    menuIndex,
    showHowToPlay,
    showChargeModal,
    showStageSelect,
    selectedStageIndex,
    muted,
    triggerMenuAction,
    insertCoin,
    handleStageSelect,
  ]);

  return (
    <div className="flex min-h-full items-center justify-center p-0 md:py-2 md:px-6 bg-[#0f0f10] text-[#f9fafb] overflow-hidden relative font-sans">
      {/* Subtle modern background gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-zinc-950/20 to-zinc-950 pointer-events-none z-0" />

      {/* Floating 3D Blocks Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {bgBlocks.map((b, i) => (
          <div
            key={i}
            className={`absolute animate-float-up ${b.size} opacity-15`}
            style={{
              left: b.left,
              animationDelay: b.delay,
              animationDuration: b.duration,
            }}
          >
            <RenderBlock type={b.type} />
          </div>
        ))}
      </div>

      {/* Main WebView Container (iPhone 13 Mini Width target: 375px) */}
      <div className="relative z-10 w-full max-w-[375px] min-h-[100vh] md:min-h-[812px] md:max-h-[812px] md:rounded-[36px] bg-[#101012] border-0 md:border-[6px] md:border-zinc-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between select-none">
        {/* Toss Style AppBar / Navigation */}
        <header className="w-full h-14 px-5 flex items-center justify-between sticky top-0 bg-[#101012]/90 backdrop-blur-md z-30 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[18px] tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Puzznic
            </span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 font-semibold px-1.5 py-0.5 rounded">
              MINI
            </span>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={() => setMuted(!muted)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-800/80 active:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
          >
            {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex flex-col justify-between p-5 pb-6 gap-6">
          {showStageSelect ? (
            /* Stage Selection Screen */
            <div className="flex-1 flex flex-col justify-between my-auto py-2">
              {/* Header Title */}
              <div className="mb-4">
                <h2 className="text-[20px] font-bold text-white tracking-tight">
                  스테이지 선택
                </h2>
                <p className="text-[12px] text-zinc-500 mt-1">
                  도전할 퍼즐 단계를 선택해 주세요.
                </p>
              </div>

              {/* Stage Grid (20 Stages) */}
              <div className="grid grid-cols-5 gap-2.5 my-auto">
                {currentLevels.map((lvl, idx) => {
                  const globalIdx = pageIndex * 20 + idx;
                  const isUnlocked = globalIdx < maxUnlockedStage;
                  const isSelected = globalIdx === selectedStageIndex;
                  return (
                    <button
                      key={globalIdx}
                      onClick={() => handleStageSelect(globalIdx)}
                      onPointerEnter={(e) => {
                        if (e.pointerType !== "touch") {
                          handleStageHover(globalIdx);
                        }
                      }}
                      className={`aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all relative cursor-pointer
                        ${
                          isSelected
                            ? "bg-[#3182f6] text-white font-bold scale-105 shadow-[0_4px_12px_rgba(49,130,246,0.35)]"
                            : isUnlocked
                              ? "bg-[#1c1c1e] border border-zinc-800 text-zinc-200 hover:bg-[#252528] active:scale-95"
                              : "bg-[#17171a] border border-transparent text-zinc-700 cursor-not-allowed opacity-40"
                        }`}
                    >
                      {isUnlocked ? (
                        <span>{globalIdx + 1}</span>
                      ) : (
                        <div
                          className={
                            isSelected ? "text-white" : "text-zinc-600"
                          }
                        >
                          <LockIcon />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Pagination controls */}
              <div className="flex justify-between items-center w-full px-2 text-[13px] font-medium text-zinc-400 mt-5">
                <button
                  onClick={prevPage}
                  className={`px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer transition-colors active:bg-zinc-800 ${pageIndex === 0 ? "opacity-0 pointer-events-none" : ""}`}
                >
                  이전
                </button>
                <div className="text-[12px] text-zinc-500 font-semibold bg-zinc-900/50 px-3 py-1 rounded-full">
                  {pageIndex + 1} / {totalPages}
                </div>
                <button
                  onClick={nextPage}
                  className={`px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer transition-colors active:bg-zinc-800 ${pageIndex === totalPages - 1 ? "opacity-0 pointer-events-none" : ""}`}
                >
                  다음
                </button>
              </div>

              {/* Dismiss button */}
              <Button
                color="dark"
                variant="weak"
                display="full"
                size="large"
                onClick={() => {
                  setShowStageSelect(false);
                  playSound("select", muted);
                }}
              >
                메인 메뉴로 돌아가기
              </Button>
            </div>
          ) : (
            /* Main Menu Screen */
            <div className="flex-1 flex flex-col justify-between py-2">
              {/* Modern Logo Brand Section */}
              <div className="flex flex-col items-center justify-center text-center mt-6 mb-4">
                {/* Title */}
                <h1 className="text-[42px] font-black tracking-tight leading-none bg-gradient-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent drop-shadow-md select-none animate-retro-bounce">
                  PUZZNIC
                </h1>
                <p className="text-[13px] text-zinc-400 font-medium mt-2 tracking-wide">
                  새로운 감각의 정교한 퍼즐 매치 게임
                </p>

                {/* Sub-header block row decoration */}
                <div className="flex gap-2 justify-center py-5">
                  {blockTypes.map((t, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 animate-pulse"
                      style={{ animationDelay: `${idx * 0.15}s` }}
                    >
                      <RenderBlock type={t} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Toss Style Menu List Container */}
              <div className="flex flex-col gap-2 bg-[#17171c] rounded-[24px] border border-zinc-900 p-2 shadow-inner">
                {[
                  {
                    title: "게임 시작하기",
                    desc:
                      credits > 0
                        ? "도전할 스테이지를 고릅니다"
                        : "무료 게임으로 바로 시작",
                    color: "bg-blue-500/10 text-blue-400",
                    block: "sphere",
                  },
                  {
                    title: "레벨 에디터",
                    desc: "나만의 퍼즐 스테이지 만들기",
                    color: "bg-yellow-500/10 text-yellow-400",
                    block: "diamond",
                  },
                  {
                    title: "플레이 방법",
                    desc: "조작키 및 매치 규칙 설명",
                    color: "bg-purple-500/10 text-purple-400",
                    block: "cone",
                  },
                ].map((item, index) => {
                  const isActive = menuIndex === index;
                  return (
                    <button
                      key={index}
                      onClick={() => triggerMenuAction(index)}
                      onPointerEnter={(e) => {
                        if (e.pointerType !== "touch") {
                          handleMenuHover(index);
                        }
                      }}
                      className={`group flex items-center justify-between p-3.5 rounded-2xl transition-all text-left cursor-pointer
                        ${
                          isActive
                            ? "bg-zinc-800/80 shadow-md translate-x-1"
                            : "hover:bg-zinc-900/50"
                        }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Custom Block Representation */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color} p-1 shadow-sm`}
                        >
                          <RenderBlock type={item.block} />
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`text-[15px] font-bold transition-colors ${isActive ? "text-[#3182f6]" : "text-zinc-200"}`}
                          >
                            {item.title}
                          </span>
                          <span className="text-[12px] text-zinc-500 font-normal mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                      <ChevronRightIcon />
                    </button>
                  );
                })}
              </div>

              {/* Toss Style Financial-ish Wallet banner */}
              <div className="mt-6 bg-[#17171c] rounded-[24px] border border-zinc-900 p-4.5 flex flex-col gap-3.5 shadow-md">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-zinc-500 font-medium">
                      나의 가상 잔액
                    </span>
                    <span className="text-[18px] font-bold text-white mt-0.5">
                      보유 크레딧
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 bg-zinc-900 px-3.5 py-2 rounded-2xl border border-zinc-800">
                    <span
                      className={`text-xl font-bold ${credits > 0 ? "text-yellow-400" : "text-zinc-400"}`}
                    >
                      {credits}
                    </span>
                    <span className="text-xs text-zinc-500">개</span>
                  </div>
                </div>
                <Button
                  color="primary"
                  variant="fill"
                  display="full"
                  size="large"
                  onClick={() => {
                    setShowChargeModal(true);
                    playSound("select", muted);
                  }}
                >
                  크레딧 충전하기
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Toss Style Footer Information */}
        <footer className="w-full py-4 border-t border-zinc-900 text-center text-[11px] text-zinc-600 bg-[#101012] select-none font-medium">
          <div>© BLOODSTRAWBERRY • 2026</div>
        </footer>

        {/* BottomSheet Modal: How To Play */}
        {showHowToPlay && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center md:absolute md:rounded-[36px] overflow-hidden">
            {/* Sheet click background to dismiss */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={() => {
                setShowHowToPlay(false);
                playSound("select", muted);
              }}
            />

            {/* Actual BottomSheet Body */}
            <div className="relative w-full bg-[#1c1c1e] rounded-t-[28px] border-t border-zinc-800 px-6 pt-4 pb-8 z-50 flex flex-col gap-4 animate-slide-up max-h-[80%] overflow-y-auto">
              {/* Header Handle Bar */}
              <div className="w-9 h-1 bg-zinc-700 rounded-full mx-auto mb-3" />

              <div className="text-left mb-2">
                <h3 className="text-lg font-bold text-white">플레이 방법</h3>
                <p className="text-[12px] text-zinc-500 mt-1">
                  간단한 매치 규칙을 소개합니다.
                </p>
              </div>

              {/* Manual Info list (Toss List style) */}
              <div className="flex flex-col gap-3 text-[13px] text-zinc-300 leading-relaxed font-medium">
                <div className="flex gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/40">
                  <span className="text-[#3182f6] font-bold">1.</span>
                  <div>
                    <strong className="text-white">최종 목표:</strong> 스테이지
                    안에 있는 모든 블록을 파괴하여 제거해야 합니다.
                  </div>
                </div>
                <div className="flex gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/40">
                  <span className="text-[#3182f6] font-bold">2.</span>
                  <div>
                    <strong className="text-white">블록 이동:</strong> 클릭 후
                    드래그하거나 방향키로 블록을 양옆으로 밀어서 떨어뜨릴 수
                    있습니다.
                  </div>
                </div>
                <div className="flex gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/40">
                  <span className="text-[#3182f6] font-bold">3.</span>
                  <div>
                    <strong className="text-white">모양 맞추기:</strong> 동일한
                    아이콘을 가진 블록들이 가로나 세로로 접촉하면 즉시 함께
                    파괴됩니다.
                  </div>
                </div>
                <div className="flex gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/40">
                  <span className="text-[#3182f6] font-bold">4.</span>
                  <div>
                    <strong className="text-white">중력 작용:</strong> 아래에
                    받쳐주는 타일이 없으면 중력에 의해 낙하하므로 낙하 궤적을
                    예측해보세요.
                  </div>
                </div>
              </div>

              {/* Block icons dictionary preview */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-[20px] p-4.5 mt-2">
                <p className="text-[11px] text-center text-zinc-500 font-bold mb-3 tracking-wide">
                  퍼즐 블록 종류
                </p>
                <div className="grid grid-cols-6 gap-2 justify-items-center">
                  {blockTypes.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="w-8 h-8 p-0.5">
                        <RenderBlock type={t} />
                      </div>
                      <span className="text-[9px] font-semibold uppercase text-zinc-500">
                        {t.slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                color="primary"
                variant="fill"
                display="full"
                size="large"
                onClick={() => {
                  setShowHowToPlay(false);
                  playSound("select", muted);
                }}
              >
                확인
              </Button>
            </div>
          </div>
        )}

        {/* BottomSheet Modal: Credit Recharge */}
        {showChargeModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center md:absolute md:rounded-[36px] overflow-hidden">
            {/* Sheet click background to dismiss */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={() => {
                setShowChargeModal(false);
                playSound("select", muted);
              }}
            />

            {/* Actual BottomSheet Body */}
            <div className="relative w-full bg-[#1c1c1e] rounded-t-[28px] border-t border-zinc-800 px-6 pt-4 pb-8 z-50 flex flex-col gap-4 animate-slide-up text-center">
              {/* Header Handle Bar */}
              <div className="w-9 h-1 bg-zinc-700 rounded-full mx-auto mb-3" />

              <div className="w-16 h-16 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center p-3 text-yellow-500 animate-bounce mt-2">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <div className="mt-2">
                <h3 className="text-lg font-bold text-white">
                  가상 크레딧 충전
                </h3>
                <p className="text-[13px] text-zinc-400 mt-1.5 leading-relaxed px-4">
                  무료 충전 단추를 눌러 게임 크레딧을 채우세요. <br />
                  실제 비용은 청구되지 않으니 안심하세요!
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  color="dark"
                  variant="weak"
                  display="full"
                  size="large"
                  onClick={() => {
                    setShowChargeModal(false);
                    playSound("select", muted);
                  }}
                >
                  닫기
                </Button>
                <div className="flex-1 flex flex-col gap-2">
                  {iapSupported && products.length > 0 ? (
                    products.map((product) => (
                      <Button
                        key={product.sku}
                        color="primary"
                        variant="fill"
                        display="full"
                        size="large"
                        loading={isInserting}
                        onClick={() => handleIapBuy(product.sku)}
                      >
                        {product.displayName} ({product.displayAmount})
                      </Button>
                    ))
                  ) : (
                    <Button
                      color="primary"
                      variant="fill"
                      display="full"
                      size="large"
                      loading={isInserting}
                      onClick={() => insertCoin()}
                    >
                      1개 충전하기
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
