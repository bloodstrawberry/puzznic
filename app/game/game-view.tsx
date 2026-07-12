"use client";

import React, { useState, useEffect } from "react";
import { useGameEngine, CellType, BUILTIN_LEVELS } from "./game-engine";
import Link from "next/link";
import BlockRenderer, {
  BLOCK_EMPTY,
  BLOCK_WALL,
  BLOCK_WALL_V,
  BLOCK_WALL_H,
  BLOCK_AUTO_WALL_V,
  BLOCK_AUTO_WALL_H,
  PUZZLE_BLOCK_TYPES,
  BLOCK_BOMB,
} from "../object";

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

interface GameViewProps {
  isEditor?: boolean;
}

export default function GameView({ isEditor = false }: GameViewProps) {
  const [playTestMode, setPlayTestMode] = useState<boolean>(false);
  const activeEditor = isEditor && !playTestMode;

  const {
    grid,
    setGrid,
    cursor,
    setCursor,
    timeLeft,
    retries,
    isGameOver,
    isLevelCleared,
    isProcessing,
    blockCounts,
    levelIndex,
    loadLevel,
    resetLevel,
    moveBlock,
    editorPlaceBlock,
    editorClearGrid,
    editorResizeGrid,
    muted,
    setMuted,
    grabbed,
    setGrabbed,
    flashingBlocks,
  } = useGameEngine(0, activeEditor);


  const [selectedPaint, setSelectedPaint] = useState<CellType | "eraser">(BLOCK_WALL);
  const [exportModalContent, setExportModalContent] = useState<string | null>(null);
  const [importText, setImportText] = useState<string>("");

  // Keyboard navigation inside grid for Puzznic game
  useEffect(() => {
    if (activeEditor || isGameOver || isLevelCleared || isProcessing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Grab/Deselect action with Space
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        const cell = grid[cursor.y][cursor.x];
        const isPuzzleBlock =
          cell !== BLOCK_EMPTY &&
          cell !== BLOCK_WALL &&
          cell !== BLOCK_AUTO_WALL_V &&
          cell !== BLOCK_AUTO_WALL_H;
        if (grabbed) {
          setGrabbed(false);
          playSound("select", muted);
        } else {
          if (isPuzzleBlock) {
            setGrabbed(true);
            playSound("select", muted);
          } else {
            playSound("error", muted);
          }
        }
        return;
      }

      // 2. Grabbing slide actions
      if (grabbed) {
        const cell = grid[cursor.y][cursor.x];
        if (cell === BLOCK_WALL_V) {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            moveBlock(cursor.x, cursor.y, 0, -1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            moveBlock(cursor.x, cursor.y, 0, 1);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            playSound("error", muted);
          }
        } else {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            moveBlock(cursor.x, cursor.y, -1, 0);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            moveBlock(cursor.x, cursor.y, 1, 0);
          } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            playSound("error", muted);
          }
        }
        return;
      }

      // 3. Normal navigation (when not grabbed)
      let dx = 0;
      let dy = 0;

      if (e.key === "ArrowLeft") {
        dx = -1;
      } else if (e.key === "ArrowRight") {
        dx = 1;
      } else if (e.key === "ArrowUp") {
        dy = -1;
      } else if (e.key === "ArrowDown") {
        dy = 1;
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        setGrabbed(false);
        resetLevel();
        return;
      }

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        setCursor((prev) => {
          const cols = grid[0]?.length || 8;
          const rows = grid.length || 8;
          const nx = Math.max(0, Math.min(cols - 1, prev.x + dx));
          const ny = Math.max(0, Math.min(rows - 1, prev.y + dy));
          playSound("select", muted);
          return { x: nx, y: ny };
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeEditor,
    cursor,
    isGameOver,
    isLevelCleared,
    isProcessing,
    muted,
    moveBlock,
    resetLevel,
    setCursor,
    grid,
    grabbed,
    setGrabbed,
  ]);



  // Click handler on cells
  const handleCellClick = (x: number, y: number) => {
    if (activeEditor) {
      const tool: CellType = selectedPaint === "eraser" ? BLOCK_EMPTY : selectedPaint;
      editorPlaceBlock(x, y, tool);
    } else {
      setGrabbed(false);
      setCursor({ x, y });
      playSound("select", muted);
    }
  };

  // Switch to Play Test Mode using editor grid
  const togglePlayTest = () => {
    setGrabbed(false);
    if (playTestMode) {
      setPlayTestMode(false);
    } else {
      setPlayTestMode(true);
      const cols = grid[0]?.length || 8;
      const rows = grid.length || 8;
      setCursor({ x: Math.floor(cols / 2), y: rows - 1 });
    }
    playSound("start", muted);
  };

  // Export grid layout as JSON
  const handleExport = () => {
    const data = {
      name: "CUSTOM LEVEL",
      grid: grid,
      timeLimit: 90,
      retries: 3,
    };
    setExportModalContent(JSON.stringify(data));
    playSound("start", muted);
  };

  const handleImport = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.grid)) {
        setGrid(parsed.grid);
        setExportModalContent(null);
        playSound("start", muted);
      } else {
        alert("Invalid format");
        playSound("error", muted);
      }
    } catch {
      alert("Invalid JSON");
      playSound("error", muted);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950 retro-bricks overflow-hidden relative font-press-start select-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-0 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        
        {/* Navigation Bar */}
        <div className="w-[96%] bg-zinc-900 border-4 border-b-0 border-zinc-800 rounded-t-2xl px-6 py-4 flex items-center justify-between shadow-[inset_0_4px_10px_rgba(255,255,255,0.15)] select-none">
          <div className="flex gap-4 items-center">
            <Link
              href="/home"
              onClick={() => playSound("select", muted)}
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
              onClick={() => setMuted(!muted)}
              className="text-zinc-500 hover:text-zinc-300 text-[10px] cursor-pointer focus:outline-none"
            >
              {muted ? "🔊 UNMUTE" : "🔇 MUTE"}
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
                    {isEditor ? "CUSTOM" : `LEVEL ${levelIndex + 1}`}
                  </span>
                  <span className="text-white text-[9px]">
                    {isEditor ? "[EDIT]" : `[1-${levelIndex + 1}]`}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-cyan-400">TIME</span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-xs font-bold">{timeLeft}s</span>
                    {/* Time limit progress bar */}
                    <div className="flex-1 h-2 bg-zinc-950 border border-zinc-800 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          timeLeft > 20 ? "bg-emerald-500" : "bg-red-500 animate-pulse"
                        }`}
                        style={{
                          width: `${(timeLeft / (BUILTIN_LEVELS[levelIndex]?.timeLimit || 90)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-black/40 border border-zinc-900 p-2 rounded">
                  <span className="text-cyan-400">RETRY</span>
                  <span className="text-emerald-400 font-bold text-xs">{retries}</span>
                </div>
              </div>

              {/* Target Blocks box */}
              <div className="flex-1 flex flex-col justify-end mt-4">
                <div className="bg-black/80 border-4 border-double border-zinc-700 p-3 rounded-lg flex flex-col min-h-[160px]">
                  <div className="text-[7.5px] text-zinc-500 text-center mb-2 uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                    BLOCKS TO MATCH
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-2 gap-y-3.5 mt-1 overflow-y-auto max-h-[160px] pr-1">
                    {Object.keys(blockCounts).length === 0 ? (
                      <div className="col-span-2 text-center text-[7.5px] text-zinc-600 mt-6 uppercase">
                        EMPTY GRID
                      </div>
                    ) : (
                      Object.entries(blockCounts).map(([typeStr, count]) => {
                        const type = Number(typeStr);
                        const isCleared = count === 0;
                        return (
                          <div
                            key={type}
                            className={`flex items-center gap-1.5 ${isCleared ? "opacity-25 line-through" : ""}`}
                          >
                            <div className="w-5 h-5 flex-shrink-0">
                              <BlockRenderer id={type} />
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

                {/* Dynamic Play Grid */}
                <div
                  className="grid gap-0.5 bg-black/60 relative z-10 w-full justify-center"
                  style={{
                    gridTemplateColumns: `repeat(${grid[0]?.length || 8}, minmax(0, 1fr))`,
                    maxWidth: `${(grid[0]?.length || 8) * 44}px`,
                  }}
                >
                  {grid.map((row, y) =>
                    row.map((cell, x) => {
                      const isCursor = cursor.x === x && cursor.y === y && !activeEditor;
                      
                      return (
                        <div
                          key={`${y}-${x}`}
                          onClick={() => handleCellClick(x, y)}
                          onContextMenu={(e) => {
                            if (activeEditor && !playTestMode) {
                              e.preventDefault();
                              editorPlaceBlock(x, y, BLOCK_EMPTY);
                            }
                          }}
                          className={`w-9 sm:w-11 aspect-square relative border border-zinc-900/30 flex items-center justify-center transition-all cursor-pointer overflow-visible ${
                            activeEditor ? "hover:bg-zinc-800/40" : ""
                          }`}
                        >
                          {/* Inner grid styling scanline effect */}
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] pointer-events-none" />

                          {/* Render grid cell elements */}
                          {cell !== BLOCK_EMPTY && (
                            <div className={`w-[88%] h-[88%] transform active:scale-95 transition-transform ${
                              flashingBlocks[`${y},${x}`] ? "animate-match-flash pointer-events-none" : ""
                            }`}>
                              <BlockRenderer id={cell} />
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
                </div>
              </div>

              {/* Status notifications overlays (Cleared / GameOver) */}
              {(isGameOver || isLevelCleared) && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-[2px] z-40 flex flex-col items-center justify-center gap-4 text-center p-4">
                  {isLevelCleared ? (
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
                        setGrabbed(false);
                        if (!isEditor) {
                          const nextIdx = (levelIndex + 1) % BUILTIN_LEVELS.length;
                          loadLevel(nextIdx);
                        } else {
                          resetLevel();
                        }
                      }}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded text-[9px] cursor-pointer border border-yellow-600 font-bold shadow"
                    >
                      {isEditor ? "RETRY" : "NEXT LEVEL"}
                    </button>
                    <button
                      onClick={() => {
                        setGrabbed(false);
                        resetLevel();
                      }}
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
                  onClick={() => setSelectedPaint(BLOCK_WALL)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_WALL
                      ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <BlockRenderer id={BLOCK_WALL} />
                </button>

                {/* Puzzle blocks */}
                {PUZZLE_BLOCK_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedPaint(type)}
                    className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${
                      selectedPaint === type
                        ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                        : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    <BlockRenderer id={type} />
                  </button>
                ))}

                {/* Bomb block */}
                <button
                  onClick={() => setSelectedPaint(BLOCK_BOMB)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_BOMB
                      ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                  title="Bomb Block"
                >
                  <BlockRenderer id={BLOCK_BOMB} />
                </button>

                {/* Moving slider walls */}
                <button
                  onClick={() => setSelectedPaint(BLOCK_WALL_V)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_WALL_V
                      ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                  title="Vertical Moving Wall"
                >
                  <BlockRenderer id={BLOCK_WALL_V} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_WALL_H)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_WALL_H
                      ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                  title="Horizontal Moving Wall"
                >
                  <BlockRenderer id={BLOCK_WALL_H} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_AUTO_WALL_V)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_AUTO_WALL_V
                      ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                  title="Vertical Auto-Moving Wall"
                >
                  <BlockRenderer id={BLOCK_AUTO_WALL_V} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_AUTO_WALL_H)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_AUTO_WALL_H
                      ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                  title="Horizontal Auto-Moving Wall"
                >
                  <BlockRenderer id={BLOCK_AUTO_WALL_H} />
                </button>
              </div>

              {/* Map actions */}
              <div className="flex flex-wrap justify-between items-center gap-2 mt-2 pt-2 border-t border-zinc-700">
                <div className="text-[7.5px] text-zinc-500 max-w-[280px] uppercase leading-relaxed">
                  Tip: Paint wall blocks to design grids and constraints, then select puzzle shapes. Click test level to test your map!
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Rows / Cols control */}
                  <div className="flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-white select-none">
                    <span className="text-[7px] text-zinc-500 font-bold">ROWS</span>
                    <button
                      onClick={() => editorResizeGrid(grid.length - 1, grid[0].length)}
                      disabled={grid.length <= 4}
                      className="w-4 h-4 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-[8px] text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    >
                      -
                    </button>
                    <span className="text-[8px] text-yellow-400 font-bold w-3 text-center">{grid.length}</span>
                    <button
                      onClick={() => editorResizeGrid(grid.length + 1, grid[0].length)}
                      disabled={grid.length >= 12}
                      className="w-4 h-4 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-[8px] text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    >
                      +
                    </button>
                    
                    <span className="text-zinc-800">|</span>

                    <span className="text-[7px] text-zinc-500 font-bold">COLS</span>
                    <button
                      onClick={() => editorResizeGrid(grid.length, grid[0].length - 1)}
                      disabled={grid[0].length <= 4}
                      className="w-4 h-4 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-[8px] text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    >
                      -
                    </button>
                    <span className="text-[8px] text-yellow-400 font-bold w-3 text-center">{grid[0].length}</span>
                    <button
                      onClick={() => editorResizeGrid(grid.length, grid[0].length + 1)}
                      disabled={grid[0].length >= 16}
                      className="w-4 h-4 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-[8px] text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={editorClearGrid}
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
                    [PLAYTESTING MODE] Move selection: [Arrows] | Grab block: [Space] | Slide: [Left/Right].
                  </span>
                ) : (
                  <span>
                    MOVE SELECTION: [Arrow keys] | Grab Block: [Space] | Slide block: [Arrow Left/Right]. Restart stage: [R]
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
                        onClick={() => {
                          setGrabbed(false);
                          loadLevel(idx);
                        }}
                        className={`w-7 h-7 flex items-center justify-center rounded border text-[9px] cursor-pointer transition-colors ${
                          levelIndex === idx
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
                  playSound("select", muted);
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
                    playSound("select", muted);
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
