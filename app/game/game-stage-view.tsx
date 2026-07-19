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
  firedOnce?: Record<string, boolean>;
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
  editorDeleteRow?: (y: number) => void;
  editorDeleteCol?: (x: number) => void;
}

export default function GameStageView({
  grid,
  cursor,
  activeEditor,
  playTestMode,
  grabbed,
  flashingBlocks,
  bullets,
  firedOnce,
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
  editorDeleteRow,
  editorDeleteCol,
}: GameStageViewProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  return (
    <div className="flex-1 flex flex-col items-center justify-center mt-6 md:mt-0 relative animate-fade-in w-full h-full select-none">
      {/* Decorative lawn details around the stage (clover, sprouts, and tiny wildflowers) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top left sprout cluster */}
        <div className="absolute top-[8%] left-[6%] flex items-center gap-1 opacity-80">
          <span className="text-[14px]">🌱</span>
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-sm" />
          <span className="text-[10px] text-emerald-600 font-bold ml-0.5">🍀</span>
        </div>
        {/* Bottom left plants */}
        <div className="absolute bottom-[12%] left-[10%] flex items-end gap-1.5 opacity-75">
          <span className="text-[15px]">🌿</span>
          <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-sm mb-1" />
        </div>
        {/* Top right clover */}
        <div className="absolute top-[12%] right-[12%] flex items-center gap-1 opacity-75">
          <span className="text-[13px]">☘️</span>
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-sm" />
        </div>
        {/* Bottom right flower dots */}
        <div className="absolute bottom-[16%] right-[8%] flex items-center gap-1.5 opacity-80">
          <span className="text-[14px]">🌸</span>
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-sm" />
          <span className="text-[12px] text-emerald-600 font-bold">🌱</span>
        </div>
      </div>

      {/* Seamless Game Stage Grid Container */}
      <div className="relative p-2 md:p-4 flex flex-col items-center justify-center w-full z-10">
        
        {/* Top: Column delete buttons */}
        {activeEditor && (
          <div className="flex w-full justify-center mb-1">
            {/* Left spacer to align with the grid (offsetting the row delete buttons column) */}
            <div className="w-[32px] md:w-[36px] mr-1 flex-shrink-0" />
            <div
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${grid[0]?.length || 8}, minmax(0, 1fr))`,
                maxWidth: `${(grid[0]?.length || 8) * 44}px`,
                gap: `${STAGE_GRID_GAP_REM}rem`,
              }}
            >
              {Array.from({ length: grid[0]?.length || 8 }).map((_, x) => {
                const isColEmpty = grid.every(row => row[x] === BLOCK_EMPTY);
                return (
                  <button
                    key={`col-del-${x}`}
                    onClick={() => editorDeleteCol?.(x)}
                    onMouseEnter={() => setHoveredCol(x)}
                    onMouseLeave={() => setHoveredCol(null)}
                    className={`w-full aspect-square rounded-[22%] flex items-center justify-center transition-all border text-[9px] md:text-[10px] font-bold cursor-pointer shadow-sm select-none ${
                      isColEmpty 
                        ? "bg-red-950/40 hover:bg-red-900/60 border-red-900/50 text-red-300 hover:text-white" 
                        : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                    title={isColEmpty ? "이 열 완전히 지우기" : "이 열 비우기"}
                  >
                    {isColEmpty ? "❌" : "⬇️"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Middle: Row delete buttons + Grid */}
        <div className="flex items-stretch justify-center w-full">
          {/* Left: Row delete buttons */}
          {activeEditor && (
            <div
              className="grid mr-1 flex-shrink-0 w-[32px] md:w-[36px]"
              style={{
                gridTemplateRows: `repeat(${grid.length || 8}, minmax(0, 1fr))`,
                gap: `${STAGE_GRID_GAP_REM}rem`,
              }}
            >
              {Array.from({ length: grid.length || 8 }).map((_, y) => {
                const isRowEmpty = grid[y]?.every(cell => cell === BLOCK_EMPTY);
                return (
                  <button
                    key={`row-del-${y}`}
                    onClick={() => editorDeleteRow?.(y)}
                    onMouseEnter={() => setHoveredRow(y)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`w-full aspect-square rounded-[22%] flex items-center justify-center transition-all border text-[9px] md:text-[10px] font-bold cursor-pointer shadow-sm select-none ${
                      isRowEmpty 
                        ? "bg-red-950/40 hover:bg-red-900/60 border-red-900/50 text-red-300 hover:text-white" 
                        : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                    title={isRowEmpty ? "이 행 완전히 지우기" : "이 행 비우기"}
                  >
                    {isRowEmpty ? "❌" : "➡️"}
                  </button>
                );
              })}
            </div>
          )}

          {/* Dynamic Play Grid */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="grid relative z-10 w-full justify-center animate-fade-in"
            style={{
              gridTemplateColumns: `repeat(${grid[0]?.length || 8}, minmax(0, 1fr))`,
              width: "100%",
              maxWidth: activeEditor ? `${(grid[0]?.length || 8) * 44}px` : `min(76vw, ${(grid[0]?.length || 8) * 44}px)`,
              gap: `${STAGE_GRID_GAP_REM}rem`,
            }}
          >
            {grid.map((row, y) =>
              row.map((cell, x) => {
                const isCursor =
                  cursor.x === x && cursor.y === y && !activeEditor;
                const isHighlighted = hoveredRow === y || hoveredCol === x;

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
                    className={`w-full aspect-square relative rounded-[22%] flex items-center justify-center transition-all cursor-pointer overflow-visible select-none ${
                      activeEditor
                        ? "hover:bg-emerald-500/30 hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),0_0_8px_rgba(52,211,153,0.5)]"
                        : ""
                    } ${isHighlighted ? "shadow-[0_0_8px_rgba(239,68,68,0.2)]" : ""}`}
                    style={{
                      background:
                        isHighlighted
                          ? "rgba(239, 68, 68, 0.12)"
                          : "linear-gradient(150deg, rgba(16, 50, 16, 0.25) 0%, rgba(8, 30, 8, 0.4) 100%)",
                      boxShadow:
                        "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 1px rgba(255, 255, 255, 0.05)",
                      border: isHighlighted
                        ? "1px solid rgba(239, 68, 68, 0.35)"
                        : "1px solid rgba(34, 197, 94, 0.15)",
                    }}
                  >
                  {/* Render grid cell elements (blocks inside the indented slot) */}
                  {cell !== BLOCK_EMPTY && (
                    <div
                      className={`transform active:scale-95 transition-transform relative z-10 ${
                        flashingBlocks[`${y},${x}`] ? "animate-match-flash pointer-events-none" : ""
                      }`}
                      style={{
                        width: `${STAGE_BLOCK_SIZE_PERCENT}%`,
                        height: `${STAGE_BLOCK_SIZE_PERCENT}%`,
                      }}
                    >
                      <BlockRenderer id={cell} x={x} y={y} grid={grid} firedOnce={firedOnce} />
                    </div>
                  )}

                  {/* Render Cursor Selector outline (Pulsating green if grabbed, blue if free) */}
                  {isCursor && (
                    <div
                      className={`absolute inset-0 border-2 rounded-[22%] pointer-events-none z-20 animate-pulse ${
                        grabbed
                          ? "border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-bounce"
                          : "border-[#3182f6] shadow-[0_0_10px_rgba(49,130,246,0.7)]"
                      }`}
                    >
                      {/* Glowing corner anchors */}
                      <span className={`absolute top-0 left-0 w-1.5 h-1.5 rounded-sm ${grabbed ? "bg-emerald-400" : "bg-[#3182f6]"}`} />
                      <span className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-sm ${grabbed ? "bg-emerald-400" : "bg-[#3182f6]"}`} />
                      <span className={`absolute bottom-0 left-0 w-1.5 h-1.5 rounded-sm ${grabbed ? "bg-emerald-400" : "bg-[#3182f6]"}`} />
                      <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-sm ${grabbed ? "bg-emerald-400" : "bg-[#3182f6]"}`} />
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
    </div>

      {/* Success Notification Overlay (Cleared) */}
      {isLevelCleared && (
        <div className="absolute inset-0 bg-[#121214]/85 backdrop-blur-[4px] z-40 flex flex-col items-center justify-center p-6 select-none animate-fade-in">
          {/* Toss Style Card */}
          <div className="w-full max-w-[280px] bg-[#1c1c1e] border border-zinc-800/80 rounded-[28px] p-6 shadow-2xl flex flex-col items-center gap-4 text-center animate-slide-up">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 text-3xl animate-bounce">
              🎉
            </div>
            
            <div className="flex flex-col gap-1">
              <h2 className="text-[20px] font-bold text-white tracking-tight">
                스테이지 클리어!
              </h2>
              <p className="text-[13px] text-zinc-400">
                레벨 {levelIndex + 1} 완료
              </p>
            </div>

            <div className="w-full flex flex-col gap-2 mt-2">
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
                className="w-full py-3.5 bg-[#3182f6] hover:bg-[#1b64da] active:scale-95 transition-all text-white rounded-2xl text-[14px] font-bold cursor-pointer tracking-wide shadow-lg shadow-blue-500/20"
              >
                {isEditor ? "확인" : "다음 레벨로"}
              </button>
              <span className="text-[10px] text-zinc-500 font-medium">
                [ Enter 키를 누르세요 ]
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Notification Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 bg-[#121214]/85 backdrop-blur-[4px] z-40 flex flex-col items-center justify-center p-6 select-none animate-fade-in">
          {/* Toss Style Card */}
          <div className="w-full max-w-[280px] bg-[#1c1c1e] border border-zinc-800/80 rounded-[28px] p-6 shadow-2xl flex flex-col items-center gap-4 text-center animate-slide-up">
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 text-3xl animate-bounce">
              ⚠️
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-[20px] font-bold text-white tracking-tight">
                게임 오버
              </h2>
              <p className="text-[13px] text-zinc-400">
                제한 시간이 초과되었습니다!
              </p>
            </div>

            <div className="w-full mt-2">
              <button
                onClick={() => {
                  setGrabbed(false);
                  resetLevel();
                  playSound("start", muted);
                }}
                className="w-full py-3.5 bg-[#3182f6] hover:bg-[#1b64da] active:scale-95 transition-all text-white rounded-2xl text-[14px] font-bold cursor-pointer tracking-wide shadow-lg shadow-blue-500/20"
              >
                다시 도전
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
