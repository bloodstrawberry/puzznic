"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// Retro sound synthesizer using Web Audio API (no external asset dependencies)
const playSound = (type: "coin" | "select" | "start" | "error", muted: boolean) => {
  if (muted || typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "coin") {
      // Classic 8-bit dual-tone coin sound (B5 then E6)
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
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
      // Short menu navigation blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === "start") {
      // Upward arpeggio startup melody
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playTone(523.25, now, 0.08); // C5
      playTone(659.25, now + 0.08, 0.08); // E5
      playTone(783.99, now + 0.16, 0.08); // G5
      playTone(1046.50, now + 0.24, 0.35); // C6
    } else if (type === "error") {
      // Low buzz error sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.warn("Web Audio API not initialized or blocked:", e);
  }
};

// Custom Puzznic 3D blocks SVG component
const RenderBlock = ({ type }: { type: string }) => {
  switch (type) {
    case "sphere": // Red Sphere
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <radialGradient id="sphereGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffb3b3" />
              <stop offset="30%" stopColor="#ff3333" />
              <stop offset="85%" stopColor="#b30000" />
              <stop offset="100%" stopColor="#4d0000" />
            </radialGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="url(#sphereGrad)" stroke="#050515" strokeWidth="2.5" />
          <circle cx="15" cy="15" r="4.5" fill="#ffffff" fillOpacity="0.45" filter="blur(0.5px)" />
        </svg>
      );
    case "diamond": // Yellow Diamond
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff2a3" />
              <stop offset="40%" stopColor="#ffd700" />
              <stop offset="80%" stopColor="#c59b00" />
              <stop offset="100%" stopColor="#664d00" />
            </linearGradient>
          </defs>
          <polygon points="20,2 38,20 20,38 2,20" fill="url(#goldGrad)" stroke="#050515" strokeWidth="2.5" />
          <line x1="20" y1="2" x2="20" y2="38" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" />
          <line x1="2" y1="20" x2="38" y2="20" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" />
          <polygon points="20,20 20,2 2,20" fill="#ffffff" fillOpacity="0.15" />
          <polygon points="20,20 20,38 38,20" fill="#000000" fillOpacity="0.2" />
        </svg>
      );
    case "cube": // Pink Cube
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="pinkGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffb3f0" />
              <stop offset="50%" stopColor="#ff33cc" />
              <stop offset="100%" stopColor="#990066" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="32" height="32" rx="3" fill="url(#pinkGrad)" stroke="#050515" strokeWidth="2.5" />
          <line x1="4" y1="4" x2="36" y2="36" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" />
          <polygon points="4,4 36,4 36,36" fill="#ffffff" fillOpacity="0.1" />
          <polygon points="4,36 36,36 4,4" fill="#000000" fillOpacity="0.15" />
          <rect x="10" y="10" width="20" height="20" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
      );
    case "cone": // Cyan Cone/Pyramid
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a3ffff" />
              <stop offset="60%" stopColor="#00cccc" />
              <stop offset="100%" stopColor="#006666" />
            </linearGradient>
          </defs>
          <polygon points="20,2 38,36 2,36" fill="url(#cyanGrad)" stroke="#050515" strokeWidth="2.5" />
          <line x1="20" y1="2" x2="20" y2="36" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
          <polygon points="20,2 2,36 20,36" fill="#ffffff" fillOpacity="0.2" />
          <polygon points="20,2 38,36 20,36" fill="#000000" fillOpacity="0.2" />
        </svg>
      );
    case "star": // Silver Hexagon/Star
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <radialGradient id="silverGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#d9d9d9" />
              <stop offset="100%" stopColor="#737373" />
            </radialGradient>
          </defs>
          <polygon points="20,2 25,14 38,14 28,23 32,36 20,28 8,36 12,23 2,14 15,14" fill="url(#silverGrad)" stroke="#050515" strokeWidth="2.5" />
          <polygon points="20,28 20,2 25,14" fill="#ffffff" fillOpacity="0.2" />
          <polygon points="20,28 20,2 15,14" fill="#000000" fillOpacity="0.2" />
        </svg>
      );
    case "cylinder": // Green Cylinder
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b3ffb3" />
              <stop offset="40%" stopColor="#33cc33" />
              <stop offset="85%" stopColor="#008000" />
              <stop offset="100%" stopColor="#003300" />
            </linearGradient>
          </defs>
          <path d="M 6,10 A 14,5 0 0,0 34,10 L 34,30 A 14,5 0 0,1 6,30 Z" fill="url(#greenGrad)" stroke="#050515" strokeWidth="2.5" />
          <ellipse cx="20" cy="10" rx="14" ry="5" fill="#a3ffa3" stroke="#050515" strokeWidth="2.5" />
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
  const [muted, setMuted] = useState<boolean>(false);
  const [isInserting, setIsInserting] = useState<boolean>(false);

  // Background decoration blocks configuration (static values with random offsets)
  const bgBlocks = [
    { type: "sphere", left: "10%", delay: "0s", duration: "14s", size: "w-10 h-10" },
    { type: "diamond", left: "25%", delay: "3s", duration: "16s", size: "w-8 h-8" },
    { type: "cube", left: "40%", delay: "6s", duration: "12s", size: "w-12 h-12" },
    { type: "cone", left: "55%", delay: "1s", duration: "18s", size: "w-10 h-10" },
    { type: "star", left: "70%", delay: "4s", duration: "15s", size: "w-12 h-12" },
    { type: "cylinder", left: "85%", delay: "7s", duration: "13s", size: "w-8 h-8" },
    { type: "sphere", left: "18%", delay: "8s", duration: "15s", size: "w-12 h-12" },
    { type: "diamond", left: "78%", delay: "10s", duration: "14s", size: "w-10 h-10" },
    { type: "cube", left: "48%", delay: "2s", duration: "16s", size: "w-8 h-8" },
    { type: "cone", left: "92%", delay: "5s", duration: "11s", size: "w-12 h-12" },
  ];

  const insertCoin = useCallback(() => {
    setIsInserting(true);
    playSound("coin", muted);
    setCredits((prev) => prev + 1);
    setTimeout(() => setIsInserting(false), 200);
  }, [muted]);

  const triggerMenuAction = useCallback((index: number) => {
    if (index === 0) {
      // Play Game (Requires credit or auto-inserts)
      if (credits > 0) {
        setCredits((prev) => prev - 1);
        playSound("start", muted);
        setTimeout(() => router.push("/game"), 500);
      } else {
        // Auto-insert credit animation for convenience + arcade feel
        playSound("coin", muted);
        setCredits(1);
        setTimeout(() => {
          setCredits(0);
          playSound("start", muted);
          router.push("/game");
        }, 500);
      }
    } else if (index === 1) {
      // Level Editor
      playSound("start", muted);
      setTimeout(() => router.push("/editor"), 500);
    } else if (index === 2) {
      // How To Play
      playSound("select", muted);
      setShowHowToPlay(true);
    }
  }, [credits, muted, router]);

  const handleMenuHover = useCallback((index: number) => {
    if (menuIndex !== index) {
      setMenuIndex(index);
      playSound("select", muted);
    }
  }, [menuIndex, muted]);

  // Keyboard navigation for full retro feel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showHowToPlay) {
        if (e.key === "Escape" || e.key === "Enter") {
          setShowHowToPlay(false);
          playSound("select", muted);
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
  }, [menuIndex, showHowToPlay, muted, triggerMenuAction, insertCoin]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-zinc-950 retro-bricks overflow-hidden relative font-press-start">
      {/* Dark tint overlay over bricks */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] z-0 pointer-events-none" />

      {/* Smooth floating background blocks */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {bgBlocks.map((b, i) => (
          <div
            key={i}
            className={`absolute animate-float-up ${b.size} opacity-40`}
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

      {/* Main Arcade Cabinet Body */}
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
        {/* Cabinet Marquee / Header */}
        <div className="w-[94%] bg-zinc-900 border-4 border-b-0 border-zinc-800 rounded-t-2xl px-6 py-4 flex items-center justify-between shadow-[inset_0_4px_10px_rgba(255,255,255,0.15)] relative overflow-hidden select-none">
          {/* Backlight effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-yellow-500/20 to-cyan-500/10 animate-pulse pointer-events-none" />
          <div className="text-[10px] text-zinc-400 tracking-wider">BLOODSTRAWBERRY</div>
          <div className="text-yellow-400 text-xs animate-pulse font-bold tracking-widest">★ INSERT COIN OR PRESS START ★</div>

          {/* Mute Button */}
          <button
            onClick={() => setMuted(!muted)}
            className="text-zinc-500 hover:text-zinc-300 text-[10px] focus:outline-none transition-colors z-20 cursor-pointer"
          >
            {muted ? "🔊 UNMUTE" : "🔇 MUTE"}
          </button>
        </div>

        {/* CRT Bezel Frame */}
        <div className="w-full bg-zinc-900 border-[14px] border-zinc-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),_inset_0_4px_10px_rgba(255,255,255,0.1)] p-4 relative">
          {/* CRT Screen inside Bezel */}
          <div className="crt-screen crt-glow-effect bg-[#05050f] w-full aspect-[4/3] rounded-lg border-[6px] border-black flex flex-col justify-between p-4 md:p-6 text-white text-[11px] relative overflow-hidden select-none">

            {/* Top Scoreboard HUD */}
            <div className="flex justify-between w-full text-zinc-300 uppercase leading-relaxed text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-amber-500 text-[10px]">1UP</span>
                <span className="tracking-widest">0</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-cyan-400 text-[10px]">HIGH SCORE</span>
                <span className="tracking-widest">50000</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-zinc-400 text-[10px]">LEVEL</span>
                <span className="text-emerald-400">1-1</span>
              </div>
            </div>

            {/* Logo and Menu Panel */}
            <div className="flex-1 flex flex-col justify-center items-center gap-6 my-2">
              {/* Bouncy Retro PUZZNIC Title Logo */}
              <div className="flex justify-center text-4xl sm:text-5xl gap-1 text-center font-black select-none py-2 relative">
                {[
                  { char: "P", color: "from-orange-400 to-red-600" },
                  { char: "U", color: "from-pink-400 to-rose-600" },
                  { char: "Z", color: "from-yellow-300 to-amber-500" },
                  { char: "Z", color: "from-cyan-400 to-blue-600" },
                  { char: "N", color: "from-purple-400 to-indigo-600" },
                  { char: "I", color: "from-green-400 to-emerald-600" },
                  { char: "C", color: "from-blue-400 to-indigo-600" },
                ].map((l, i) => (
                  <span
                    key={i}
                    className={`relative inline-block bg-gradient-to-b ${l.color} bg-clip-text text-transparent`}
                    style={{
                      filter: "drop-shadow(3px 3px 0px #000000)",
                      animation: `retro-bounce 1.6s infinite ease-in-out ${i * 0.12}s`,
                    }}
                  >
                    {l.char}
                  </span>
                ))}
              </div>

              {/* Sub-header block graphic decoration */}
              <div className="flex gap-2 justify-center py-1">
                {blockTypes.map((t, idx) => (
                  <div key={idx} className="w-5 h-5 opacity-80 animate-pulse" style={{ animationDelay: `${idx * 0.25}s` }}>
                    <RenderBlock type={t} />
                  </div>
                ))}
              </div>

              {/* Interactive Retro Menu */}
              <div className="flex flex-col gap-4 mt-2 w-full max-w-[280px]">
                {[
                  { label: "PLAY GAME", desc: credits > 0 ? "START PUZZLE" : "FREE GAME START" },
                  { label: "LEVEL EDITOR", desc: "CREATE LEVELS" },
                  { label: "HOW TO PLAY", desc: "CONTROLS & RULE" }
                ].map((item, index) => {
                  const isActive = menuIndex === index;
                  return (
                    <button
                      key={index}
                      onClick={() => triggerMenuAction(index)}
                      onMouseEnter={() => handleMenuHover(index)}
                      className="group flex flex-col items-center justify-center p-2 rounded relative border border-transparent focus:outline-none transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 relative">
                        {isActive && (
                          <span className="text-yellow-400 text-xs animate-pulse absolute -left-5">▶</span>
                        )}
                        <span className={`text-[12px] tracking-wide transition-all ${isActive ? "text-yellow-400 scale-105" : "text-zinc-400"}`}>
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="text-yellow-400 text-xs animate-pulse absolute -right-5">◀</span>
                        )}
                      </div>
                      <span className="text-[7px] text-zinc-500 mt-1 tracking-wider group-hover:text-zinc-400">
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Credits & Info Bar */}
            <div className="flex justify-between w-full text-zinc-400 text-[9px] border-t border-zinc-900 pt-2 select-none uppercase">
              <div>© BLOODSTRAWBERRY / 2026</div>
              <div className="flex gap-2">
                <span className="text-red-500">CREDIT</span>
                <span className={credits > 0 ? "text-yellow-400 animate-pulse font-bold" : "text-zinc-500"}>
                  {credits}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cabinet Control Deck / Coin Door Mimic */}
        <div className="w-[96%] bg-zinc-800 border-4 border-t-0 border-zinc-700 rounded-b-2xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-[0_15px_30px_rgba(0,0,0,0.6)] select-none">
          {/* Controls instructions */}
          <div className="text-[8px] text-zinc-400 max-w-[200px] mb-3 sm:mb-0 leading-relaxed text-center sm:text-left uppercase">
            [↑/↓] MOVE SELECTION<br />
            [ENTER] SELECT OPTION<br />
            [C] INSERT COIN
          </div>

          {/* Interactive Mechanical Coin Door Slot */}
          <button
            onClick={insertCoin}
            className={`group bg-zinc-900 border-2 ${isInserting ? "border-red-500" : "border-zinc-700 hover:border-red-500"} p-2.5 rounded-lg flex flex-col items-center gap-1.5 min-w-[120px] transition-all active:scale-95 shadow-md relative cursor-pointer overflow-hidden`}
          >
            {/* Glowing amber light */}
            <div className={`absolute top-0 inset-x-0 h-0.5 bg-red-500 blur-[1px] opacity-80`} />
            <div className="text-[7px] text-zinc-500 tracking-widest group-hover:text-zinc-400 uppercase">25¢ COIN SLOT</div>
            <div className="w-1.5 h-7 bg-zinc-950 border border-zinc-800 rounded relative shadow-inner">
              {/* Coin slot light */}
              <div className={`absolute inset-0 bg-red-600/70 animate-pulse ${isInserting ? "bg-red-400/90 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : ""}`} />
            </div>
            <div className={`text-[7px] ${credits > 0 ? "text-yellow-500 animate-pulse" : "text-zinc-500"} uppercase`}>
              {credits > 0 ? "CREDITS READY" : "INSERT COIN"}
            </div>
          </button>
        </div>
      </div>

      {/* How To Play Overlay Modal */}
      {showHowToPlay && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-4 border-zinc-700 max-w-lg w-full rounded-xl p-6 shadow-2xl relative text-zinc-300 font-sans select-none flex flex-col gap-4">

            {/* Modal title in retro style */}
            <div className="text-center border-b-2 border-zinc-800 pb-3">
              <h2 className="text-xl font-bold font-press-start text-yellow-400 tracking-wide">HOW TO PLAY</h2>
              <p className="text-[9px] text-zinc-500 font-press-start mt-2">CLASSIC GAMEPLAY RULE</p>
            </div>

            {/* Explanations */}
            <div className="text-sm leading-relaxed flex flex-col gap-3">
              <p className="text-zinc-300">
                Puzznic is an arcade puzzle match game where you move blocks to align matching shapes.
              </p>

              <ul className="list-disc pl-5 text-zinc-400 flex flex-col gap-2">
                <li>
                  <strong className="text-white">Goal:</strong> Clear all blocks from the game arena.
                </li>
                <li>
                  <strong className="text-white">Movement:</strong> Click and drag, or use arrows to select and slide blocks left or right.
                </li>
                <li>
                  <strong className="text-white">Matching:</strong> When two or more identical blocks touch, they immediately disappear!
                </li>
                <li>
                  <strong className="text-white">Gravity:</strong> Unsupported blocks fall downwards. Use gravity and level geometry to guide matches!
                </li>
                <li>
                  <strong className="text-white">Timer:</strong> You must clear the grid before the time bar runs out!
                </li>
              </ul>

              {/* Block icons demo */}
              <div className="bg-black/40 border border-zinc-800 rounded-lg p-3 mt-1">
                <p className="text-[10px] font-press-start text-center text-zinc-400 mb-3">PUZZLE BLOCK IDENTIFIERS</p>
                <div className="grid grid-cols-6 gap-2 justify-items-center">
                  {blockTypes.map((t, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div className="w-7 h-7">
                        <RenderBlock type={t} />
                      </div>
                      <span className="text-[7px] font-press-start uppercase text-zinc-500">{t.slice(0, 4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Dismiss Action */}
            <button
              onClick={() => {
                setShowHowToPlay(false);
                playSound("select", muted);
              }}
              className="mt-2 w-full py-3 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black text-xs font-press-start font-bold rounded-lg border-2 border-yellow-600 cursor-pointer shadow-md transition-colors"
            >
              OK (DISMISS)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
