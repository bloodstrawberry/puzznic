"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  useGameEngine,
  CellType,
  BUILTIN_LEVELS,
  type Bullet,
} from "./game-engine";
import Link from "next/link";
import { useEditorHotkeys, ALL_PAINT_TOOLS } from "./hot-key";
import BlockRenderer, {
  BLOCK_EMPTY,
  BLOCK_WALL,
  BLOCK_WALL_V,
  BLOCK_WALL_H,
  BLOCK_AUTO_WALL_V,
  BLOCK_AUTO_WALL_H,
  PUZZLE_BLOCK_TYPES,
  BLOCK_BOMB,
  BLOCK_SHOOTER_L,
  BLOCK_SHOOTER_R,
  BLOCK_SHOOTER_L_ONCE,
  BLOCK_SHOOTER_R_ONCE,
  BLOCK_SPIKE_U,
  BLOCK_SPIKE_D,
  BLOCK_SPIKE_L,
  BLOCK_SPIKE_R,
} from "../object";

// Retro sound synthesizer proxy
const playSound = (
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
      playTone(1046.5, now + 0.24, 0.35);
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
    } else if (type === "shoot") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "break") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    console.warn("AudioContext failed:", e);
  }
};

function Bullet({ bullet, W, H }: { bullet: Bullet; W: number; H: number }) {
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

// Always return 0 for SSR/hydration consistency.
// The actual stage from URL params is loaded via useEffect after mount.
const getInitialStageIndex = (): number => {
  return 0;
};

interface GameViewProps {
  isEditor?: boolean;
}

export default function GameView({ isEditor = false }: GameViewProps) {
  const [playTestMode, setPlayTestMode] = useState<boolean>(false);
  const activeEditor = isEditor && !playTestMode;

  const [initialStageIdx] = useState(getInitialStageIndex);

  const {
    grid,
    cursor,
    setCursor,
    timeLeft,
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
    editorFillBorder,
    muted,
    setMuted,
    grabbed,
    setGrabbed,
    flashingBlocks,
    bullets,
    editorLevels,
    editorActiveIndex,
    selectEditorLevel,
    editorAddLevel,
    editorDeleteLevel,
    editorUpdateTimeLimit,
    editorImportJSON,
    editorRestoreLevel,
    editorUndo,
    editorPushHistory,
  } = useGameEngine(initialStageIdx, activeEditor, isEditor);

  const [selectedPaint, setSelectedPaint] = useState<CellType | "eraser">(
    BLOCK_WALL,
  );
  const [exportModalContent, setExportModalContent] = useState<string | null>(
    null,
  );
  const [importText, setImportText] = useState<string>("");
  const handleStageInputChange = (target: HTMLInputElement) => {
    const num = parseInt(target.value, 10);
    if (!isNaN(num) && num >= 1 && num <= editorLevels.length) {
      playSound("select", muted);
      selectEditorLevel(num - 1);
    } else {
      playSound("error", muted);
      target.value = (editorActiveIndex + 1).toString();
    }
  };

  const gameViewRef = useRef({
    grid,
    cursor,
    grabbed,
    isProcessing,
    isGameOver,
    isLevelCleared,
    activeEditor,
    muted,
    moveBlock,
    resetLevel,
    setCursor,
    setGrabbed,
    levelIndex,
    loadLevel,
    isEditor,
  });

  useEffect(() => {
    gameViewRef.current = {
      grid,
      cursor,
      grabbed,
      isProcessing,
      isGameOver,
      isLevelCleared,
      activeEditor,
      muted,
      moveBlock,
      resetLevel,
      setCursor,
      setGrabbed,
      levelIndex,
      loadLevel,
      isEditor,
    };
  }, [
    grid,
    cursor,
    grabbed,
    isProcessing,
    isGameOver,
    isLevelCleared,
    activeEditor,
    muted,
    moveBlock,
    resetLevel,
    setCursor,
    setGrabbed,
    levelIndex,
    loadLevel,
    isEditor,
  ]);

  const hasLoadedUrlStageRef = useRef<boolean>(false);

  // Read stage query param on mount/load and load it exactly once
  useEffect(() => {
    if (hasLoadedUrlStageRef.current) return;

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const stageParam = searchParams.get("stage");
      if (stageParam) {
        const stageIdx = parseInt(stageParam, 10) - 1;
        if (stageIdx >= 0 && stageIdx < BUILTIN_LEVELS.length) {
          loadLevel(stageIdx);
          hasLoadedUrlStageRef.current = true;
        }
      }
    }
  }, [loadLevel]);

  // Fallback to mark as loaded after 1 second if no stage param is found (e.g. direct /game visit)
  useEffect(() => {
    const t = setTimeout(() => {
      hasLoadedUrlStageRef.current = true;
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  // Sync levelIndex to URL query parameter
  useEffect(() => {
    if (typeof window !== "undefined" && !isEditor) {
      const searchParams = new URLSearchParams(window.location.search);
      const currentStageNum = levelIndex + 1;
      if (searchParams.get("stage") !== currentStageNum.toString()) {
        searchParams.set("stage", currentStageNum.toString());
        const newRelativePathQuery =
          window.location.pathname + "?" + searchParams.toString();
        window.history.replaceState(null, "", newRelativePathQuery);
      }
    }
  }, [levelIndex, isEditor]);

  // Unlock next stage when a stage is cleared
  useEffect(() => {
    if (isLevelCleared && !isEditor) {
      if (typeof window !== "undefined") {
        const nextLevel = levelIndex + 2; // index 0 cleared -> stage 2 unlocked
        if (nextLevel <= BUILTIN_LEVELS.length) {
          const maxUnlocked = parseInt(localStorage.getItem("puzznic_max_unlocked") || "1", 10);
          if (nextLevel > maxUnlocked) {
            localStorage.setItem("puzznic_max_unlocked", nextLevel.toString());
          }
        }
      }
    }
  }, [isLevelCleared, levelIndex, isEditor]);

  // Keyboard navigation inside grid for Puzznic game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        grid: curGrid,
        cursor: curCursor,
        grabbed: initialGrabbed,
        isGameOver: curGameOver,
        isLevelCleared: curLevelCleared,
        activeEditor: curActiveEditor,
        muted: curMuted,
        moveBlock: curMoveBlock,
        resetLevel: curResetLevel,
        setCursor: curSetCursor,
        setGrabbed: curSetGrabbed,
        levelIndex: curLevelIndex,
        loadLevel: curLoadLevel,
        isEditor: curIsEditor,
      } = gameViewRef.current;
      let curGrabbed = initialGrabbed;

      if (curLevelCleared) {
        if (e.key === "Enter") {
          e.preventDefault();
          curSetGrabbed(false);
          if (!curIsEditor) {
            const nextIdx = (curLevelIndex + 1) % BUILTIN_LEVELS.length;
            curLoadLevel(nextIdx);
          } else {
            curResetLevel();
          }
          playSound("start", curMuted);
        }
        return;
      }

      if (curActiveEditor || curGameOver) return;

      // 1. Grab/Deselect action with Space
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        const cell = curGrid[curCursor.y]?.[curCursor.x];
        const isPuzzleBlock =
          cell !== undefined &&
          cell !== BLOCK_EMPTY &&
          cell !== BLOCK_WALL &&
          cell !== BLOCK_AUTO_WALL_V &&
          cell !== BLOCK_AUTO_WALL_H &&
          cell !== BLOCK_SPIKE_U &&
          cell !== BLOCK_SPIKE_D &&
          cell !== BLOCK_SPIKE_L &&
          cell !== BLOCK_SPIKE_R;
        if (curGrabbed) {
          curSetGrabbed(false);
          playSound("select", curMuted);
        } else {
          if (isPuzzleBlock) {
            curSetGrabbed(true);
            playSound("select", curMuted);
          } else {
            playSound("error", curMuted);
          }
        }
        return;
      }

      // Release lock if the selector cell no longer has a valid puzzle block while grabbed
      const currentCellAtCursor = curGrid[curCursor.y]?.[curCursor.x];
      const isCursorPuzzleBlock =
        currentCellAtCursor !== undefined &&
        currentCellAtCursor !== BLOCK_EMPTY &&
        currentCellAtCursor !== BLOCK_WALL &&
        currentCellAtCursor !== BLOCK_AUTO_WALL_V &&
        currentCellAtCursor !== BLOCK_AUTO_WALL_H &&
        currentCellAtCursor !== BLOCK_SPIKE_U &&
        currentCellAtCursor !== BLOCK_SPIKE_D &&
        currentCellAtCursor !== BLOCK_SPIKE_L &&
        currentCellAtCursor !== BLOCK_SPIKE_R;

      if (curGrabbed && !isCursorPuzzleBlock) {
        curSetGrabbed(false);
        curGrabbed = false;
      }

      // 2. Grabbing slide actions
      if (curGrabbed) {
        const cell = curGrid[curCursor.y]?.[curCursor.x];
          if (cell === BLOCK_WALL_V) {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              curMoveBlock(curCursor.x, curCursor.y, 0, -1);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              curMoveBlock(curCursor.x, curCursor.y, 0, 1);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              playSound("error", curMuted);
            }
          } else {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              curMoveBlock(curCursor.x, curCursor.y, -1, 0);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              curMoveBlock(curCursor.x, curCursor.y, 1, 0);
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              playSound("error", curMuted);
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
        curSetGrabbed(false);
        curResetLevel();
        return;
      }

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        curSetCursor((prev) => {
          const cols = curGrid[0]?.length || 8;
          const rows = curGrid.length || 8;
          const nx = Math.max(0, Math.min(cols - 1, prev.x + dx));
          const ny = Math.max(0, Math.min(rows - 1, prev.y + dy));
          playSound("select", curMuted);
          return { x: nx, y: ny };
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Drawing states using refs for instant synchronous check during rapid mouse movement
  const isDrawingRef = useRef<boolean>(false);
  const drawingToolRef = useRef<CellType>(BLOCK_EMPTY);

  // Global mouseup and blur listener to stop drawing
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDrawingRef.current = false;
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("blur", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("blur", handleGlobalMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent, x: number, y: number) => {
    if (!activeEditor) return;
    if (e.button !== 0 && e.button !== 2) return; // Left or Right click only

    e.preventDefault(); // Stop text/block drag selection

    isDrawingRef.current = true;
    editorPushHistory();
    const isErase = e.button === 2 || selectedPaint === "eraser";
    const tool = isErase ? BLOCK_EMPTY : (selectedPaint as CellType);
    drawingToolRef.current = tool;

    editorPlaceBlock(x, y, tool);
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (!activeEditor || !isDrawingRef.current) return;
    editorPlaceBlock(x, y, drawingToolRef.current);
  };

  // Click handler on cells
  const handleCellClick = (x: number, y: number) => {
    if (activeEditor) return;
    setGrabbed(false);
    setCursor({ x, y });
    playSound("select", muted);
  };

  // Switch to Play Test Mode using editor grid
  const togglePlayTest = () => {
    setGrabbed(false);
    if (playTestMode) {
      setPlayTestMode(false);
      editorRestoreLevel();
    } else {
      setPlayTestMode(true);
      const cols = grid[0]?.length || 8;
      const rows = grid.length || 8;
      setCursor({ x: Math.floor(cols / 2), y: rows - 1 });
    }
    playSound("start", muted);
  };

  // Format JSON to write each 1D row array of grid on a single line
  const formatLevelsJSON = (levels: typeof editorLevels): string => {
    const levelStrings = levels.map((lvl) => {
      const gridRows = lvl.grid.map((row) => `      [${row.join(", ")}]`);
      const gridStr = `    "grid": [\n${gridRows.join(",\n")}\n    ]`;
      return `  {\n    "name": ${JSON.stringify(lvl.name)},\n    "timeLimit": ${lvl.timeLimit},\n${gridStr}\n  }`;
    });
    return `[\n${levelStrings.join(",\n")}\n]`;
  };

  // Export grid layout as JSON
  const handleExport = () => {
    setExportModalContent(formatLevelsJSON(editorLevels));
    playSound("start", muted);
  };

  // Download level data JSON file
  const handleDownload = () => {
    if (!exportModalContent) return;
    const blob = new Blob([exportModalContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "real-map.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playSound("start", muted);
  };

  const handleImport = (jsonStr: string) => {
    const success = editorImportJSON(jsonStr);
    if (success) {
      setExportModalContent(null);
      playSound("start", muted);
    } else {
      alert("Invalid format or JSON");
      playSound("error", muted);
    }
  };

  useEditorHotkeys({
    active: activeEditor,
    handlers: {
      onPrevStage: () => {
        if (editorActiveIndex > 0) {
          playSound("select", muted);
          selectEditorLevel(editorActiveIndex - 1);
        }
      },
      onNextStage: () => {
        if (editorActiveIndex < editorLevels.length - 1) {
          playSound("select", muted);
          selectEditorLevel(editorActiveIndex + 1);
        }
      },
      onUndo: () => {
        editorUndo();
      },
      onBorderWall: () => {
        editorFillBorder();
      },
      onClearGrid: () => {
        editorClearGrid();
      },
      onExportJson: () => {
        const jsonStr = formatLevelsJSON(editorLevels);
        navigator.clipboard.writeText(jsonStr)
          .then(() => {
            alert("Level data JSON copied to clipboard directly!");
            playSound("start", muted);
          })
          .catch((err) => {
            console.error("Clipboard copy failed:", err);
            playSound("error", muted);
          });
      },
      onSelectBlock: (num: number) => {
        if (num === 1) {
          setSelectedPaint(BLOCK_WALL);
        } else if (num >= 2 && num <= 9) {
          const blockType = PUZZLE_BLOCK_TYPES[num - 2];
          if (blockType !== undefined) {
            setSelectedPaint(blockType);
          }
        }
        playSound("select", muted);
      },
      onSelectNextBlock: () => {
        const idx = ALL_PAINT_TOOLS.indexOf(selectedPaint);
        const nextIdx = (idx + 1) % ALL_PAINT_TOOLS.length;
        setSelectedPaint(ALL_PAINT_TOOLS[nextIdx]);
        playSound("select", muted);
      },
      onSelectPrevBlock: () => {
        const idx = ALL_PAINT_TOOLS.indexOf(selectedPaint);
        const prevIdx = (idx - 1 + ALL_PAINT_TOOLS.length) % ALL_PAINT_TOOLS.length;
        setSelectedPaint(ALL_PAINT_TOOLS[prevIdx]);
        playSound("select", muted);
      },
      onAddStage: () => {
        editorAddLevel();
      },
    },
  });

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
              {isEditor
                ? playTestMode
                  ? "EDIT MODE (TESTING)"
                  : "MAP EDITOR MODE"
                : "ARCADE STAGE"}
            </span>
          </div>

          <div className="flex gap-4 items-center">
            {isEditor && (
              <button
                onClick={togglePlayTest}
                className={`px-3 py-1.5 rounded text-[8px] cursor-pointer transition-all border ${playTestMode
                  ? "bg-red-600 hover:bg-red-500 border-red-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 border-emerald-700 text-white animate-pulse"
                  }`}
              >
                {playTestMode ? "⏹ STOP TEST" : "▶ TEST LEVEL"}
              </button>
            )}
            <button
              onClick={() => {
                setGrabbed(false);
                resetLevel();
                playSound("select", muted);
              }}
              className="text-zinc-500 hover:text-zinc-300 text-[10px] cursor-pointer focus:outline-none uppercase"
            >
              🔄 RETRY
            </button>
            <span className="text-[10px] text-zinc-700">|</span>
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
                  <span className="text-cyan-400 text-xs uppercase flex items-center gap-1">
                    {isEditor ? (
                      <>
                        STAGE{" "}
                        <input
                          key={editorActiveIndex}
                          type="text"
                          defaultValue={editorActiveIndex + 1}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleStageInputChange(e.currentTarget);
                            }
                          }}
                          onBlur={(e) => handleStageInputChange(e.currentTarget)}
                          className="w-10 bg-zinc-950 border border-zinc-800 text-cyan-400 text-xs text-center focus:outline-none focus:border-cyan-500 font-mono py-0.5 rounded"
                        />{" "}
                        / {editorLevels.length}
                      </>
                    ) : (
                      `LEVEL ${levelIndex + 1}`
                    )}
                  </span>
                  {activeEditor ? (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => {
                          playSound("select", muted);
                          selectEditorLevel(editorActiveIndex - 1);
                        }}
                        disabled={editorActiveIndex === 0}
                        className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 text-[8px] cursor-pointer text-white font-bold"
                        title="Previous Stage"
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => {
                          playSound("select", muted);
                          selectEditorLevel(editorActiveIndex + 1);
                        }}
                        disabled={editorActiveIndex === editorLevels.length - 1}
                        className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 text-[8px] cursor-pointer text-white font-bold"
                        title="Next Stage"
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => {
                          editorAddLevel();
                        }}
                        className="px-1.5 py-0.5 bg-emerald-800 border border-emerald-700 hover:bg-emerald-700 text-[8px] cursor-pointer text-white font-bold"
                        title="Add Stage"
                      >
                        ➕
                      </button>
                      <button
                        onClick={() => {
                          editorDeleteLevel();
                        }}
                        disabled={editorLevels.length <= 1}
                        className="px-1.5 py-0.5 bg-red-800 border border-red-700 hover:bg-red-700 disabled:opacity-40 text-[8px] cursor-pointer text-white font-bold"
                        title="Delete Stage"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <span className="text-white text-[9px]">
                      {isEditor ? "[TESTING]" : `[1-${levelIndex + 1}]`}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-cyan-400">TIME LIMIT</span>
                  <div className="flex items-center gap-1.5">
                    {activeEditor ? (
                      <>
                        <button
                          onClick={() => {
                            playSound("select", muted);
                            editorUpdateTimeLimit(timeLeft - 10);
                          }}
                          disabled={timeLeft <= 10}
                          className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-[8px] cursor-pointer text-white font-bold disabled:opacity-40"
                          title="Decrease Time Limit"
                        >
                          -10s
                        </button>
                        <span className="text-yellow-400 text-[10px] font-bold w-12 text-center">
                          {timeLeft}s
                        </span>
                        <button
                          onClick={() => {
                            playSound("select", muted);
                            editorUpdateTimeLimit(timeLeft + 10);
                          }}
                          className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-[8px] cursor-pointer text-white font-bold"
                          title="Increase Time Limit"
                        >
                          +10s
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-yellow-400 text-xs font-bold w-10 text-center">
                          {timeLeft}s
                        </span>
                        <div className="flex-1 h-2 bg-zinc-950 border border-zinc-800 rounded overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${timeLeft > 20
                              ? "bg-emerald-500"
                              : "bg-red-500 animate-pulse"
                              }`}
                            style={{
                              width: `${(timeLeft / (BUILTIN_LEVELS[levelIndex]?.timeLimit || 180)) * 100}%`,
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
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
                <div className="absolute inset-2 bg-zinc-800 z-0 pointer-events-none" />

                {/* Dynamic Play Grid */}
                <div
                  className="grid gap-0.5 bg-zinc-800 relative z-10 w-full justify-center"
                  style={{
                    gridTemplateColumns: `repeat(${grid[0]?.length || 8}, minmax(0, 1fr))`,
                    maxWidth: `${(grid[0]?.length || 8) * 44}px`,
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
                          className={`w-9 sm:w-11 aspect-square relative border border-zinc-900/30 flex items-center justify-center transition-all cursor-pointer overflow-visible ${activeEditor ? "hover:bg-zinc-700/50" : ""
                            }`}
                        >
                          {/* Inner grid styling scanline effect */}
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] pointer-events-none" />

                          {/* Render grid cell elements */}
                          {cell !== BLOCK_EMPTY && (
                            <div
                              className={`w-[88%] h-[88%] transform active:scale-95 transition-transform ${flashingBlocks[`${y},${x}`]
                                ? "animate-match-flash pointer-events-none"
                                : ""
                                }`}
                            >
                              <BlockRenderer
                                id={cell}
                                x={x}
                                y={y}
                                grid={grid}
                              />
                            </div>
                          )}

                          {/* Render Cursor Selector outline (Pulsating gold if grabbed, red if free) */}
                          {isCursor && (
                            <div
                              className={`absolute inset-0 border-2 pointer-events-none z-20 animate-pulse ${grabbed
                                ? "border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)] animate-bounce"
                                : "border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                                }`}
                            >
                              {/* Glowing corner anchors */}
                              <span
                                className={`absolute top-0 left-0 w-1.5 h-1.5 ${grabbed ? "bg-yellow-400" : "bg-red-500"}`}
                              />
                              <span
                                className={`absolute top-0 right-0 w-1.5 h-1.5 ${grabbed ? "bg-yellow-400" : "bg-red-500"}`}
                              />
                              <span
                                className={`absolute bottom-0 left-0 w-1.5 h-1.5 ${grabbed ? "bg-yellow-400" : "bg-red-500"}`}
                              />
                              <span
                                className={`absolute bottom-0 right-0 w-1.5 h-1.5 ${grabbed ? "bg-yellow-400" : "bg-red-500"}`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    }),
                  )}

                  {/* Render flying bullets */}
                  {bullets.map((bullet) => (
                    <Bullet
                      key={bullet.id}
                      bullet={bullet}
                      W={grid[0]?.length || 8}
                      H={grid.length || 8}
                    />
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
                          const nextIdx =
                            (levelIndex + 1) % BUILTIN_LEVELS.length;
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
                  <h2 className="text-xl text-red-500 tracking-widest animate-pulse font-press-start">
                    GAME OVER
                  </h2>
                  <p className="text-[8px] text-zinc-500 uppercase">
                    Time has run out!
                  </p>

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
          </div>
        </div>

        {/* BOTTOM SECTION: EDITOR PALETTE & LEVEL SELECTORS */}
        <div className="w-[98%] bg-zinc-800 border-4 border-t-0 border-zinc-700 rounded-b-2xl p-4 flex flex-col gap-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
          {activeEditor ? (
            // Editor Toolbar
            <div className="flex flex-col gap-3">
              <div className="text-[8px] text-zinc-400 border-b border-zinc-700 pb-2 flex justify-between items-center uppercase">
                <span>
                  SELECT PAINT TOOL AND CLICK OR DRAG THE GRID CELLS TO DRAW
                </span>
                <span className="text-yellow-400">EDITOR PALETTE</span>
              </div>

              {/* Block Selection Palette */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Eraser */}
                <button
                  onClick={() => setSelectedPaint("eraser")}
                  className={`px-3 py-2 rounded text-[8.5px] border cursor-pointer flex items-center gap-1.5 transition-all ${selectedPaint === "eraser"
                    ? "bg-red-600 border-red-700 text-white shadow-lg scale-105"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                  🧹 ERASER
                </button>

                {/* Wall block */}
                <button
                  onClick={() => setSelectedPaint(BLOCK_WALL)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_WALL
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
                    className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === type
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
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_BOMB
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
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_WALL_V
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Vertical Moving Wall"
                >
                  <BlockRenderer id={BLOCK_WALL_V} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_WALL_H)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_WALL_H
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Horizontal Moving Wall"
                >
                  <BlockRenderer id={BLOCK_WALL_H} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_AUTO_WALL_V)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_AUTO_WALL_V
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Vertical Auto-Moving Wall"
                >
                  <BlockRenderer id={BLOCK_AUTO_WALL_V} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_AUTO_WALL_H)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_AUTO_WALL_H
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Horizontal Auto-Moving Wall"
                >
                  <BlockRenderer id={BLOCK_AUTO_WALL_H} />
                </button>

                {/* Shooter blocks */}
                <button
                  onClick={() => setSelectedPaint(BLOCK_SHOOTER_L)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_SHOOTER_L
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Shooter Left (Repeated)"
                >
                  <BlockRenderer id={BLOCK_SHOOTER_L} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SHOOTER_R)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_SHOOTER_R
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Shooter Right (Repeated)"
                >
                  <BlockRenderer id={BLOCK_SHOOTER_R} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SHOOTER_L_ONCE)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_SHOOTER_L_ONCE
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Shooter Left (Once)"
                >
                  <BlockRenderer id={BLOCK_SHOOTER_L_ONCE} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SHOOTER_R_ONCE)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_SHOOTER_R_ONCE
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Shooter Right (Once)"
                >
                  <BlockRenderer id={BLOCK_SHOOTER_R_ONCE} />
                </button>

                {/* Spike blocks */}
                <button
                  onClick={() => setSelectedPaint(BLOCK_SPIKE_U)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_SPIKE_U
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Spike Up"
                >
                  <BlockRenderer id={BLOCK_SPIKE_U} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SPIKE_D)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_SPIKE_D
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Spike Down"
                >
                  <BlockRenderer id={BLOCK_SPIKE_D} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SPIKE_L)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_SPIKE_L
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Spike Left"
                >
                  <BlockRenderer id={BLOCK_SPIKE_L} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SPIKE_R)}
                  className={`w-9 h-9 p-0.5 rounded border cursor-pointer transition-all ${selectedPaint === BLOCK_SPIKE_R
                    ? "border-yellow-400 bg-zinc-900 scale-105 shadow-md"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  title="Spike Right"
                >
                  <BlockRenderer id={BLOCK_SPIKE_R} />
                </button>
              </div>

              {/* Map actions */}
              <div className="flex flex-wrap justify-between items-center gap-2 mt-2 pt-2 border-t border-zinc-700">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Rows / Cols control */}
                  <div className="flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-white select-none">
                    <span className="text-[7px] text-zinc-500 font-bold">
                      ROWS
                    </span>
                    <button
                      onClick={() =>
                        editorResizeGrid(grid.length - 1, grid[0].length)
                      }
                      disabled={grid.length <= 4}
                      className="w-4 h-4 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-[8px] text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    >
                      -
                    </button>
                    <span className="text-[8px] text-yellow-400 font-bold w-3 text-center">
                      {grid.length}
                    </span>
                    <button
                      onClick={() =>
                        editorResizeGrid(grid.length + 1, grid[0].length)
                      }
                      disabled={grid.length >= 12}
                      className="w-4 h-4 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-[8px] text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    >
                      +
                    </button>

                    <span className="text-zinc-800">|</span>

                    <span className="text-[7px] text-zinc-500 font-bold">
                      COLS
                    </span>
                    <button
                      onClick={() =>
                        editorResizeGrid(grid.length, grid[0].length - 1)
                      }
                      disabled={grid[0].length <= 4}
                      className="w-4 h-4 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-[8px] text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    >
                      -
                    </button>
                    <span className="text-[8px] text-yellow-400 font-bold w-3 text-center">
                      {grid[0].length}
                    </span>
                    <button
                      onClick={() =>
                        editorResizeGrid(grid.length, grid[0].length + 1)
                      }
                      disabled={grid[0].length >= 16}
                      className="w-4 h-4 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-[8px] text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={editorFillBorder}
                    className="px-3 py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-900 rounded text-[8px] cursor-pointer"
                  >
                    🧱 BORDER WALL
                  </button>
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
            // Gameplay Controls
            <div className="flex items-center justify-center sm:justify-start">
              <div className="text-[7.5px] text-zinc-400 leading-relaxed uppercase max-w-[480px] text-center sm:text-left">
                {playTestMode ? (
                  <span className="text-yellow-400 font-bold">
                    [PLAYTESTING MODE] Move selection: [Arrows] | Grab block:
                    [Space] | Slide: [Left/Right].
                  </span>
                ) : (
                  <span>
                    MOVE SELECTION: [Arrow keys] | Grab Block: [Space] | Slide
                    block: [Arrow Left/Right]. Restart stage: [R]
                  </span>
                )}
              </div>
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
                {exportModalContent.length > 0
                  ? "EXPORT LEVEL DATA"
                  : "IMPORT LEVEL DATA"}
              </h2>
            </div>

            <p className="text-xs text-zinc-400">
              {exportModalContent.length > 0
                ? "Copy the level data JSON string below to save or share:"
                : "Paste a level data JSON string below to load it into the editor:"}
            </p>

            <textarea
              readOnly={exportModalContent.length > 0}
              value={
                exportModalContent.length > 0 ? exportModalContent : importText
              }
              onChange={(e) => {
                if (exportModalContent.length === 0) {
                  setImportText(e.target.value);
                }
              }}
              className="w-full h-32 bg-black border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-zinc-700"
              placeholder='[{"name":"LEVEL 1-1","grid":[[0,0,...]],"timeLimit":180}]'
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
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[10px] cursor-pointer"
                  >
                    DOWNLOAD FILE
                  </button>
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
                </div>
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
