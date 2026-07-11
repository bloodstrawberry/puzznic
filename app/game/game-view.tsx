"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useGameEngine, CellType, Position, BUILTIN_LEVELS } from "./game-engine";
import Link from "next/link";

// Retro sound synthesizer proxy
const playSound = (type: "coin" | "select" | "start" | "error" | "match" | "fall", muted: boolean) => {
  if (muted || typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "coin") {
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
      playTone(523.25, now, 0.08);
      playTone(659.25, now + 0.08, 0.08);
      playTone(783.99, now + 0.16, 0.08);
      playTone(1046.50, now + 0.24, 0.35);
    } else if (type === "error") {
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
    console.warn("AudioContext failed:", e);
  }
};

// SVG Block Elements
const RenderBlock = ({ type }: { type: string }) => {
  switch (type) {
    case "wall":
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#d9d9d9" />
              <stop offset="75%" stopColor="#8c8c8c" />
              <stop offset="100%" stopColor="#404040" />
            </linearGradient>
          </defs>
          <rect x="1.5" y="1.5" width="37" height="37" fill="url(#wallGrad)" stroke="#050515" strokeWidth="2.5" />
          <line x1="2" y1="2" x2="38" y2="38" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
          <line x1="2" y1="38" x2="38" y2="2" stroke="#000000" strokeOpacity="0.3" strokeWidth="1.5" />
          <rect x="7" y="7" width="26" height="26" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" />
          <rect x="8" y="8" width="24" height="24" fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="1.5" />
        </svg>
      );
    case "sphere":
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
    case "diamond":
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
          <polygon points="20,20 20,38 38,20" fill="#000000" fillOpacity="0.25" />
        </svg>
      );
    case "cube":
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
          <polygon points="4,36 36,36 4,4" fill="#000000" fillOpacity="0.2" />
          <rect x="10" y="10" width="20" height="20" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
      );
    case "cone":
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
          <polygon points="20,2 38,36 20,36" fill="#000000" fillOpacity="0.25" />
        </svg>
      );
    case "star":
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
    case "cylinder":
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b3ffb3" />
            <stop offset="40%" stopColor="#33cc33" />
            <stop offset="85%" stopColor="#008000" />
            <stop offset="100%" stopColor="#003300" />
          </linearGradient>
          <path d="M 6,10 A 14,5 0 0,0 34,10 L 34,30 A 14,5 0 0,1 6,30 Z" fill="url(#greenGrad)" stroke="#050515" strokeWidth="2.5" />
          <ellipse cx="20" cy="10" rx="14" ry="5" fill="#a3ffa3" stroke="#050515" strokeWidth="2.5" />
        </svg>
      );
    case "triangle_down": // Blue Inverted Triangle
      return (
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#80a0ff" />
              <stop offset="60%" stopColor="#2040ee" />
              <stop offset="100%" stopColor="#051080" />
            </linearGradient>
          </defs>
          <polygon points="20,38 38,4 2,4" fill="url(#blueGrad)" stroke="#050515" strokeWidth="2.5" />
          <line x1="20" y1="38" x2="20" y2="4" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
          <polygon points="20,38 2,4 20,4" fill="#ffffff" fillOpacity="0.2" />
          <polygon points="20,38 38,4 20,4" fill="#000000" fillOpacity="0.25" />
        </svg>
      );
    default:
      return null;
  }
};

const blockTypes: CellType[] = [
  "sphere",
  "diamond",
  "cube",
  "cone",
  "star",
  "cylinder",
  "triangle_down",
];

interface GameViewProps {
  isEditor?: boolean;
}

export default function GameView({ isEditor = false }: GameViewProps) {
  // In editor mode, we can toggle into "playTest" mode to test gameplay.
  const [playTestMode, setPlayTestMode] = useState<boolean>(false);
  const activeEditor = isEditor && !playTestMode;

  const engine = useGameEngine(0, activeEditor);
  const [selectedPaint, setSelectedPaint] = useState<CellType | "eraser">("wall");
  const [exportModalContent, setExportModalContent] = useState<string | null>(null);
  const [importText, setImportText] = useState<string>("");

  // Keyboard navigation inside grid for Puzznic game
  useEffect(() => {
    if (activeEditor || engine.isGameOver || engine.isLevelCleared || engine.isProcessing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let dx = 0;
      let dy = 0;
      let action: "move-left" | "move-right" | null = null;

      if (e.key === "ArrowLeft") {
        if (e.shiftKey || e.code === "Space") action = "move-left";
        else dx = -1;
      } else if (e.key === "ArrowRight") {
        if (e.shiftKey || e.code === "Space") action = "move-right";
        else dx = 1;
      } else if (e.key === "ArrowUp") {
        dy = -1;
      } else if (e.key === "ArrowDown") {
        dy = 1;
      } else if (e.key === "a" || e.key === "A") {
        action = "move-left";
      } else if (e.key === "d" || e.key === "D") {
        action = "move-right";
      } else if (e.key === "r" || e.key === "R") {
        engine.resetLevel();
        return;
      }

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        engine.setCursor((prev) => {
          const nx = Math.max(0, Math.min(7, prev.x + dx));
          const ny = Math.max(0, Math.min(7, prev.y + dy));
          playSound("select", engine.muted);
          return { x: nx, y: ny };
        });
      }

      if (action) {
        e.preventDefault();
        const dir = action === "move-left" ? -1 : 1;
        engine.moveBlock(engine.cursor.x, engine.cursor.y, dir);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeEditor,
    engine.cursor,
    engine.isGameOver,
    engine.isLevelCleared,
    engine.isProcessing,
    engine.muted,
    engine.moveBlock,
    engine.resetLevel,
  ]);

  // Click handler on cells
  const handleCellClick = (x: number, y: number) => {
    if (activeEditor) {
      // Paint grid cell
      const tool: CellType = selectedPaint === "eraser" ? "empty" : selectedPaint;
      engine.editorPlaceBlock(x, y, tool);
    } else {
      // Move cursor
      engine.setCursor({ x, y });
      playSound("select", engine.muted);
    }
  };

  // Switch to Play Test Mode using editor grid
  const togglePlayTest = () => {
    if (playTestMode) {
      // Return to Editor
      setPlayTestMode(false);
    } else {
      // Store current grid in engine for playtesting
      setPlayTestMode(true);
      engine.setIsGameOver(false);
      engine.setIsLevelCleared(false);
      engine.setCursor({ x: 3, y: 7 });
    }
    playSound("start", engine.muted);
  };

  // Export grid layout as JSON
  const handleExport = () => {
    const data = {
      name: "CUSTOM LEVEL",
      grid: engine.grid,
      timeLimit: 90,
      retries: 3,
    };
    setExportModalContent(JSON.stringify(data));
    playSound("start", engine.muted);
  };

  const handleImport = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.grid)) {
        engine.setGrid(parsed.grid);
        setExportModalContent(null);
        playSound("start", engine.muted);
      } else {
        alert("Invalid format");
        playSound("error", engine.muted);
      }
    } catch {
      alert("Invalid JSON");
      playSound("error", engine.muted);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950 retro-bricks overflow-hidden relative font-press-start select-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-0 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        
        {/* Navigation Bar */}
        <div className="w-[96%] bg-zinc-900 border-4 border-b-0 border-zinc-800 rounded-t-2xl px-6 py-4 flex items-center justify-between shadow-[inset_0_4px_10px_rgba(255,255,255,0.15)] select-none">
          <div className="flex gap-4 items-center">
            <Link
              href="/home"
              onClick={() => playSound("select", engine.muted)}
              className="text-zinc-400 hover:text-white text-[10px] transition-colors cursor-pointer"
            >
              ◀ BACK TO CAB
            </Link>
            <span className="text-[10px] text-zinc-500">|</span>
            <span className="text-zinc-300 text-[10px] uppercase">
              {isEditor ? (playTestMode ? "EDIT MODE (TESTING)" : "MAP EDITOR MODE") : "ARCADE STAGE"}
            </span>
          </div>

          <div className="flex gap-4 items-center">
            {isEditor && (
              <button
                onClick={togglePlayTest}
                className={`px-3 py-1.5 rounded text-[8px] cursor-pointer transition-all border ${
                  playTestMode
                    ? "bg-red-600 hover:bg-red-500 border-red-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 border-emerald-700 text-white animate-pulse"
                }`}
              >
                {playTestMode ? "⏹ STOP TEST" : "▶ TEST LEVEL"}
              </button>
            )}
            <button
              onClick={() => engine.setMuted(!engine.muted)}
              className="text-zinc-500 hover:text-zinc-300 text-[10px] cursor-pointer focus:outline-none"
            >
              {engine.muted ? "🔊 UNMUTE" : "🔇 MUTE"}
            </button>
          </div>
        </div>

        {/* CRT cabinet Bezel */}
        <div className="w-full bg-zinc-900 border-[14px] border-zinc-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-4 relative">
          
          {/* CRT Screen wrapper */}
          <div className="crt-screen crt-glow-effect bg-[#050511] w-full min-h-[480px] rounded-lg border-[6px] border-black flex flex-col md:flex-row p-4 md:p-6 text-white relative">
            
            {/* LEFT COLUMN: STATS AND HUD */}
            <div className="w-full md:w-[260px] flex flex-col justify-between pr-4 border-b md:border-b-0 md:border-r border-zinc-900 pb-4 md:pb-0 md:mr-6">
              
              {/* Retro HUD stats */}
              <div className="flex flex-col gap-4 text-[10px] text-zinc-400">
                <div className="flex flex-col gap-1.5">
                  <span className="text-yellow-400">PLAYER-1</span>
                  <span className="text-white text-xs tracking-widest">0</span>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <span className="text-white font-bold">PROBLEM</span>
                  <span className="text-cyan-400 text-xs uppercase">
                    {isEditor ? "CUSTOM" : `LEVEL ${engine.levelIndex + 1}`}
                  </span>
                  <span className="text-white text-[9px]">
                    {isEditor ? "[EDIT]" : `[1-${engine.levelIndex + 1}]`}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-cyan-400">TIME</span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-xs font-bold">{engine.timeLeft}s</span>
                    {/* Time limit progress bar */}
                    <div className="flex-1 h-2 bg-zinc-950 border border-zinc-800 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          engine.timeLeft > 20 ? "bg-emerald-500" : "bg-red-500 animate-pulse"
                        }`}
                        style={{
                          width: `${(engine.timeLeft / (BUILTIN_LEVELS[engine.levelIndex]?.timeLimit || 90)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-black/40 border border-zinc-900 p-2 rounded">
                  <span className="text-cyan-400">RETRY</span>
                  <span className="text-emerald-400 font-bold text-xs">{engine.retries}</span>
                </div>
              </div>

              {/* Target Blocks box */}
              <div className="flex-1 flex flex-col justify-end mt-4">
                <div className="bg-black/80 border-4 border-double border-zinc-700 p-3 rounded-lg flex flex-col min-h-[160px]">
                  <div className="text-[7.5px] text-zinc-500 text-center mb-2 uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                    BLOCKS TO MATCH
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-2 gap-y-3.5 mt-1 overflow-y-auto max-h-[160px] pr-1">
                    {Object.keys(engine.blockCounts).length === 0 ? (
                      <div className="col-span-2 text-center text-[7.5px] text-zinc-600 mt-6 uppercase">
                        EMPTY GRID
                      </div>
                    ) : (
                      Object.entries(engine.blockCounts).map(([type, count]) => {
                        const isCleared = count === 0;
                        return (
                          <div
                            key={type}
                            className={`flex items-center gap-1.5 ${isCleared ? "opacity-25 line-through" : ""}`}
                          >
                            <div className="w-5 h-5 flex-shrink-0">
                              <RenderBlock type={type} />
                            </div>
                            <span className="text-[8px] text-zinc-400 font-press-start font-bold">
                              x{count}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER/RIGHT COLUMN: PLAY BOARD GRID */}
            <div className="flex-1 flex flex-col items-center justify-center mt-6 md:mt-0 relative">
              
              {/* Visual Stone outer border block framework */}
              <div className="relative p-3 bg-zinc-950 border-[6px] border-zinc-800 rounded-lg shadow-2xl flex items-center justify-center">
                {/* Board grid inner shadow backdrop */}
                <div className="absolute inset-2 bg-black/80 z-0 pointer-events-none" />

                {/* 8x8 Play Grid */}
                <div className="grid grid-cols-8 gap-0.5 bg-black/60 relative z-10 w-full max-w-[340px] aspect-square">
                  {engine.grid.map((row, y) =>
                    row.map((cell, x) => {
                      const isCursor = engine.cursor.x === x && engine.cursor.y === y && !activeEditor;
                      const hasBlock = cell !== "empty" && cell !== "wall";
                      
                      return (
                        <div
                          key={`${y}-${x}`}
                          onClick={() => handleCellClick(x, y)}
                          className={`w-9 sm:w-11 aspect-square relative border border-zinc-900/30 flex items-center justify-center transition-all cursor-pointer overflow-visible ${
                            activeEditor ? "hover:bg-zinc-800/40" : ""
                          }`}
                        >
                          {/* Inner grid styling scanline effect */}
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] pointer-events-none" />

                          {/* Render grid cell elements */}
                          {cell !== "empty" && (
                            <div className="w-[88%] h-[88%] transform active:scale-95 transition-transform">
                              <RenderBlock type={cell} />
                            </div>
                          )}

                          {/* Render RED Cursor Selector outline */}
                          {isCursor && (
                            <div className="absolute inset-0 border-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse pointer-events-none z-20">
                              {/* Glowing corner anchors */}
                              <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-red-500" />
                              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500" />
                              <span className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-red-500" />
                              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-red-500" />
                            </div>
                          )}

                          {/* Selection sliding overlay arrows (Game mode only) */}
                          {isCursor && hasBlock && !engine.isProcessing && (
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-1 pointer-events-none z-30">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  engine.moveBlock(x, y, -1);
                                }}
                                className="w-4 h-4 rounded bg-red-600/90 text-white flex items-center justify-center text-[7px] pointer-events-auto hover:bg-red-500 active:scale-95 shadow border border-red-700"
                              >
                                ◀
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  engine.moveBlock(x, y, 1);
                                }}
                                className="w-4 h-4 rounded bg-red-600/90 text-white flex items-center justify-center text-[7px] pointer-events-auto hover:bg-red-500 active:scale-95 shadow border border-red-700"
                              >
                                ▶
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status notifications overlays (Cleared / GameOver) */}
              {(engine.isGameOver || engine.isLevelCleared) && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-[2px] z-40 flex flex-col items-center justify-center gap-4 text-center p-4">
                  {engine.isLevelCleared ? (
                    <>
                      <h2 className="text-xl text-yellow-400 animate-bounce tracking-widest">
                        STAGE CLEARED!
                      </h2>
                      <p className="text-[8px] text-zinc-500 uppercase">Excellent Puzzle Solving</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl text-red-500 tracking-widest animate-pulse">
                        GAME OVER
                      </h2>
                      <p className="text-[8px] text-zinc-500 uppercase">Time has run out!</p>
                    </>
                  )}

                  <div className="flex gap-4 mt-2">
                    <button
                      onClick={() => {
                        if (!isEditor) {
                          // Cycle to next level or loop back
                          const nextIdx = (engine.levelIndex + 1) % BUILTIN_LEVELS.length;
                          engine.loadLevel(nextIdx);
                        } else {
                          engine.resetLevel();
                        }
                      }}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded text-[9px] cursor-pointer border border-yellow-600 font-bold shadow"
                    >
                      {isEditor ? "RETRY" : "NEXT LEVEL"}
                    </button>
                    <button
                      onClick={engine.resetLevel}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[9px] cursor-pointer border border-zinc-700 shadow"
                    >
                      RESTART
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: EDITOR PALETTE & LEVEL SELECTORS */}
        <div className="w-[98%] bg-zinc-800 border-4 border-t-0 border-zinc-700 rounded-b-2xl p-4 flex flex-col gap-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
          {activeEditor ? (
            // Editor Toolbar
            <div className="flex flex-col gap-3">
              <div className="text-[8px] text-zinc-400 border-b border-zinc-700 pb-2 flex justify-between items-center uppercase">
                <span>SELECT PAINT TOOL AND CLICK THE GRID CELLS TO DRAW</span>
                <span className="text-yellow-400">EDITOR PALETTE</span>
              </div>

              {/* Block Selection Palette */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Eraser */}
                <button
                  onClick={() => setSelectedPaint("eraser")}
                  className={`px-3 py-2 rounded text-[8.5px] border cursor-pointer flex items-center gap-1.5 transition-all ${
                    selectedPaint === "eraser"
                      ? "bg-red-600 border-red-700 text-white shadow-lg scale-105"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  🧹 ERASER
                </button>

                {/* Wall block */}
                <button
                  onClick={() => setSelectedPaint("wall")}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${
                    selectedPaint === "wall"
                      ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <RenderBlock type="wall" />
                </button>

                {/* Puzzle blocks */}
                {blockTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedPaint(type)}
                    className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${
                      selectedPaint === type
                        ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                        : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    <RenderBlock type={type} />
                  </button>
                ))}
              </div>

              {/* Map actions */}
              <div className="flex flex-wrap justify-between items-center gap-2 mt-2 pt-2 border-t border-zinc-700">
                <div className="text-[7.5px] text-zinc-500 max-w-[280px] uppercase leading-relaxed">
                  Tip: Paint wall blocks to design grids and constraints, then select puzzle shapes. Click test level to test your map!
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={engine.editorClearGrid}
                    className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-900 rounded text-[8px] cursor-pointer"
                  >
                    🗑 CLEAR GRID
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-3 py-2 bg-zinc-900 hover:bg-zinc-700 text-white border border-zinc-700 rounded text-[8px] cursor-pointer"
                  >
                    📥 EXPORT JSON
                  </button>
                  <button
                    onClick={() => setExportModalContent("")}
                    className="px-3 py-2 bg-zinc-900 hover:bg-zinc-700 text-white border border-zinc-700 rounded text-[8px] cursor-pointer"
                  >
                    📤 IMPORT JSON
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Gameplay Controls & Stage selectors
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[7.5px] text-zinc-400 leading-relaxed uppercase max-w-[320px] text-center sm:text-left">
                {playTestMode ? (
                  <span className="text-yellow-400 font-bold">
                    [PLAYTESTING MODE] Move block by clicking arrows or using: Arrow key + Space / A, D keys.
                  </span>
                ) : (
                  <span>
                    MOVE SELECTION: [Arrow keys] | Slide Block: [A/D] or click red selector side arrows. Restart stage: [R]
                  </span>
                )}
              </div>

              {/* Level select list */}
              {!playTestMode && (
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-zinc-500 uppercase">SELECT STAGE:</span>
                  <div className="flex gap-1.5">
                    {BUILTIN_LEVELS.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => engine.loadLevel(idx)}
                        className={`w-7 h-7 flex items-center justify-center rounded border text-[9px] cursor-pointer transition-colors ${
                          engine.levelIndex === idx
                            ? "bg-yellow-500 border-yellow-600 text-black font-bold"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* JSON Import/Export Modal */}
      {exportModalContent !== null && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-4 border-zinc-700 max-w-lg w-full rounded-xl p-6 shadow-2xl relative text-zinc-300 font-sans flex flex-col gap-4">
            
            <div className="text-center border-b border-zinc-800 pb-2">
              <h2 className="text-md font-bold font-press-start text-yellow-400 tracking-wide">
                {exportModalContent.length > 0 ? "EXPORT LEVEL DATA" : "IMPORT LEVEL DATA"}
              </h2>
            </div>

            <p className="text-xs text-zinc-400">
              {exportModalContent.length > 0
                ? "Copy the level data JSON string below to save or share:"
                : "Paste a level data JSON string below to load it into the editor:"}
            </p>

            <textarea
              readOnly={exportModalContent.length > 0}
              value={exportModalContent.length > 0 ? exportModalContent : importText}
              onChange={(e) => {
                if (exportModalContent.length === 0) {
                  setImportText(e.target.value);
                }
              }}
              className="w-full h-32 bg-black border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-zinc-700"
              placeholder='{"name":"CUSTOM","grid":[...],"timeLimit":90,"retries":3}'
            />

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => {
                  setExportModalContent(null);
                  setImportText("");
                  playSound("select", engine.muted);
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] cursor-pointer"
              >
                CANCEL
              </button>
              
              {exportModalContent.length > 0 ? (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportModalContent);
                    alert("Copied to clipboard!");
                    playSound("select", engine.muted);
                  }}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-[10px] cursor-pointer"
                >
                  COPY TEXT
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleImport(importText);
                    setImportText("");
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] cursor-pointer"
                >
                  IMPORT NOW
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
