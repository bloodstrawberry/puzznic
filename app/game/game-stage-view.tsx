"use client";

import React, { useState, useEffect } from "react";
import BlockRenderer, {
  BLOCK_EMPTY,
  BLOCK_WALL,
  BLOCK_WALL_V,
  BLOCK_WALL_H,
  BLOCK_AUTO_WALL_V,
  BLOCK_AUTO_WALL_H,
  BLOCK_BOMB,
  BLOCK_SHOOTER_L,
  BLOCK_SHOOTER_R,
  BLOCK_SHOOTER_L_ONCE,
  BLOCK_SHOOTER_R_ONCE,
  BLOCK_SPIKE_U,
  BLOCK_SPIKE_D,
  BLOCK_SPIKE_L,
  BLOCK_SPIKE_R,
  STAGE_BLOCK_SIZE_PERCENT,
  STAGE_GRID_GAP_REM,
} from "../object";
import { CellType, Position, Bullet as BulletType, BUILTIN_LEVELS } from "./types";

interface BulletProps {
  bullet: BulletType;
  W: number;
  H: number;
}

function Bullet({ bullet, W, H }: BulletProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 20);
    return () => clearTimeout(timer);
  }, []);

  const startLeft = ((bullet.startX + 0.5) / W) * 100;
  const targetLeft = ((bullet.targetX + 0.5) / W) * 100;
  const currentLeft = mounted ? targetLeft : startLeft;
  const top = ((bullet.startY + 0.5) / H) * 100;

  return (
    <div
      className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
      style={{
        left: `${currentLeft}%`,
        top: `${top}%`,
        transition: "left 300ms linear",
        width: "24px",
        height: "12px",
      }}
    >
      <svg
        className={`w-full h-full ${bullet.dir === -1 ? "rotate-180" : ""}`}
        viewBox="0 0 24 12"
      >
        <defs>
          <linearGradient id="bulletGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0)" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <path d="M 0 6 L 16 2 L 20 6 L 16 10 Z" fill="url(#bulletGrad)" />
        <circle cx="20" cy="6" r="3" fill="#ffffff" />
      </svg>
    </div>
  );
}

interface GameStageViewProps {
  grid: CellType[][];
  cursor: Position;
  activeEditor: boolean;
  playTestMode: boolean;
  grabbed: boolean;
  flashingBlocks: Record<string, boolean>;
  bullets: BulletType[];
  isLevelCleared: boolean;
  isGameOver: boolean;
  levelIndex: number;
  isEditor: boolean;
  muted: boolean;
  setGrabbed: (grabbed: boolean) => void;
  loadLevel: (index: number) => void;
  resetLevel: () => void;
  setCursor: (cursor: Position) => void;
  playSound: (
    type:
      | "coin"
      | "select"
      | "start"
      | "error"
      | "match"
      | "fall"
      | "shoot"
      | "break",
    muted: boolean,
  ) => void;
  handleMouseDown: (e: React.MouseEvent, x: number, y: number) => void;
  handleMouseEnter: (x: number, y: number) => void;
  handleCellClick: (x: number, y: number) => void;
}

export default function GameStageView({
  grid,
  cursor,
  activeEditor,
  playTestMode,
  grabbed,
  flashingBlocks,
  bullets,
  isLevelCleared,
  isGameOver,
  levelIndex,
  isEditor,
  muted,
  setGrabbed,
  loadLevel,
  resetLevel,
  setCursor,
  playSound,
  handleMouseDown,
  handleMouseEnter,
  handleCellClick,
}: GameStageViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center mt-6 md:mt-0 relative animate-fade-in">
      {/* Visual Stone outer border block framework */}
      <div className="relative p-0.5 md:p-1 bg-[#5a8a2a] border-2 md:border-4 border-[#4a7a22] rounded-lg shadow-2xl flex items-center justify-center">
        {/* Board grid inner shadow backdrop */}
        <div className="absolute inset-0.5 bg-[#8CC63F] z-0 pointer-events-none" />

        {/* Dynamic Play Grid */}
        <div
          className="grid bg-[#8CC63F] relative z-10 w-full justify-center animate-fade-in"
          style={{
            gridTemplateColumns: `repeat(${grid[0]?.length || 8}, minmax(0, 1fr))`,
            maxWidth: `${(grid[0]?.length || 8) * 44}px`,
            gap: `${STAGE_GRID_GAP_REM}rem`,
          }}
        >
          {grid.map((row, y) =>
            row.map((cell, x) => {
              const isCursor =
                cursor.x === x && cursor.y === y && !activeEditor;

              return (
                <div
                  key={`${y}-${x}`}
                  onMouseDown={(e) => handleMouseDown(e, x, y)}
                  onMouseEnter={() => handleMouseEnter(x, y)}
                  onClick={() => handleCellClick(x, y)}
                  onContextMenu={(e) => {
                    if (activeEditor && !playTestMode) {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full aspect-square relative border border-[#6fa832]/60 flex items-center justify-center transition-all cursor-pointer overflow-visible ${
                    activeEditor ? "hover:bg-[#a8e050]/40" : ""
                  }`}
                >
                  {/* Inner grid subtle highlight */}
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,transparent_50%)] pointer-events-none" />

                  {/* Render grid cell elements */}
                  {cell !== BLOCK_EMPTY && (
                    <div
                      className={`transform active:scale-95 transition-transform ${
                        flashingBlocks[`${y},${x}`] ? "animate-match-flash pointer-events-none" : ""
                      }`}
                      style={{
                        width: `${STAGE_BLOCK_SIZE_PERCENT}%`,
                        height: `${STAGE_BLOCK_SIZE_PERCENT}%`,
                      }}
                    >
                      <BlockRenderer id={cell} x={x} y={y} grid={grid} />
                    </div>
                  )}

                  {/* Render Cursor Selector outline (Pulsating gold if grabbed, red if free) */}
                  {isCursor && (
                    <div
                      className={`absolute inset-0 border-2 pointer-events-none z-20 animate-pulse ${
                        grabbed
                          ? "border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)] animate-bounce"
                          : "border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                      }`}
                    >
                      {/* Glowing corner anchors */}
                      <span className={`absolute top-0 left-0 w-1.5 h-1.5 ${grabbed ? "bg-yellow-400" : "bg-red-500"}`} />
                      <span className={`absolute top-0 right-0 w-1.5 h-1.5 ${grabbed ? "bg-yellow-400" : "bg-red-500"}`} />
                      <span className={`absolute bottom-0 left-0 w-1.5 h-1.5 ${grabbed ? "bg-yellow-400" : "bg-red-500"}`} />
                      <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 ${grabbed ? "bg-yellow-400" : "bg-red-500"}`} />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Render flying bullets */}
          {bullets.map((bullet) => (
            <Bullet key={bullet.id} bullet={bullet} W={grid[0]?.length || 8} H={grid.length || 8} />
          ))}
        </div>
      </div>

      {/* Success Notification Overlay (Cleared) */}
      {isLevelCleared && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-[3px] z-40 flex flex-col items-center justify-center gap-5 text-center p-6 select-none animate-fade-in">
          {/* Glowing Backlight Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-emerald-500/15 to-transparent pointer-events-none animate-pulse" />

          {/* Star Icon container with bouncy animation */}
          <div className="relative animate-bounce" style={{ animationDuration: "1.2s" }}>
            <svg className="w-14 h-14 text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>

          {/* Fancy title */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest font-press-start animate-pulse uppercase">
              STAGE CLEARED!
            </h2>
            <div className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase">
              Level {levelIndex + 1} Complete
            </div>
          </div>

          {/* Pinging light indicators */}
          <div className="flex gap-3 justify-center py-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping [animation-delay:0.4s]" />
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping [animation-delay:0.6s]" />
          </div>

          {/* Confirm Button */}
          <div className="flex flex-col items-center gap-3 mt-3 w-full max-w-[200px]">
            <button
              onClick={() => {
                setGrabbed(false);
                if (!isEditor) {
                  const nextIdx = (levelIndex + 1) % BUILTIN_LEVELS.length;
                  loadLevel(nextIdx);
                } else {
                  resetLevel();
                }
                playSound("start", muted);
              }}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded text-[10px] cursor-pointer border-2 border-yellow-600 font-bold shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all hover:scale-105 active:scale-95 uppercase tracking-wider font-press-start"
            >
              {isEditor ? "CONFIRM" : "NEXT LEVEL"}
            </button>
            <span className="text-[7px] text-zinc-500 tracking-wider uppercase animate-pulse">
              [ PRESS ENTER ]
            </span>
          </div>
        </div>
      )}

      {/* Game Over Notification Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-[2px] z-40 flex flex-col items-center justify-center gap-4 text-center p-4">
          <h2 className="text-xl text-red-500 tracking-widest animate-pulse font-press-start">GAME OVER</h2>
          <p className="text-[8px] text-zinc-500 uppercase">Time has run out!</p>

          <div className="flex gap-4 mt-2">
            <button
              onClick={() => {
                setGrabbed(false);
                resetLevel();
                playSound("start", muted);
              }}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded text-[9px] cursor-pointer border border-yellow-600 font-bold shadow"
            >
              RETRY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
