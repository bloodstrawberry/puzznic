"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGameEngine, CellType, BUILTIN_LEVELS } from "./game-engine";
import GameStageView from "./game-stage-view";
import Link from "next/link";
import { useEditorHotkeys, ALL_PAINT_TOOLS } from "./hot-key";

function useToast() {
  const [toastText, setToastText] = useState<string | null>(null);

  const openToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => {
      setToastText((current) => (current === msg ? null : current));
    }, 2500);
  };

  return { openToast, toastText };
}
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
  getBlockProperties,
  useBlockImagesPreloader,
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

// Always return 0 for SSR/hydration consistency.
// The actual stage from URL params is loaded via useEffect after mount.
const getInitialStageIndex = (): number => {
  return 0;
};

interface GameViewProps {
  isEditor?: boolean;
}

interface GameContentProps extends GameViewProps {
  onFullReset?: () => void;
}

function GameContent({ isEditor = false, onFullReset }: GameContentProps) {
  const [playTestMode, setPlayTestMode] = useState<boolean>(false);
  const activeEditor = isEditor && !playTestMode;

  const [initialStageIdx] = useState(getInitialStageIndex);
  const toast = useToast();

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
    editorDeleteRow,
    editorDeleteCol,
    editorFlipHorizontal,
    muted,
    setMuted,
    grabbed,
    setGrabbed,
    flashingBlocks,
    bullets,
    firedOnce,
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
    editorMapType,
    setEditorMapType,
    changeMapType,
  } = useGameEngine(initialStageIdx, activeEditor, isEditor);

  const [selectedPaint, setSelectedPaint] = useState<CellType | "eraser">(
    BLOCK_WALL,
  );
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
  const [exportModalContent, setExportModalContent] = useState<string | null>(
    null,
  );
  const [importText, setImportText] = useState<string>("");
  const [cheaterPopupOpen, setCheaterPopupOpen] = useState<boolean>(false);
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
    onFullReset,
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
      onFullReset,
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
    onFullReset,
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
          const maxUnlocked = parseInt(
            localStorage.getItem("puzznic_max_unlocked") || "1",
            10,
          );
          if (isEditor || stageIdx + 1 <= maxUnlocked) {
            loadLevel(stageIdx);
          } else {
            localStorage.setItem("puzznic_max_unlocked", "1");
            loadLevel(0);
            setTimeout(() => {
              setCheaterPopupOpen(true);
            }, 0);
            playSound("error", muted);
          }
          hasLoadedUrlStageRef.current = true;
        }
      }
    }
  }, [loadLevel, isEditor, muted]);

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
          const maxUnlocked = parseInt(
            localStorage.getItem("puzznic_max_unlocked") || "1",
            10,
          );
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
        isProcessing: curProcessing,
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
        onFullReset: curOnFullReset,
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

      if (curActiveEditor || curGameOver || curProcessing) return;

      // 1. Grab/Deselect action with Space
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        const cell = curGrid[curCursor.y]?.[curCursor.x];
        const isPuzzleBlock =
          cell !== undefined && getBlockProperties(cell, curGrid)?.canSelect;
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
        getBlockProperties(currentCellAtCursor, curGrid)?.canSelect;

      if (curGrabbed && !isCursorPuzzleBlock && !curProcessing) {
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
        if (!curIsEditor && curOnFullReset) {
          curOnFullReset();
        } else {
          curResetLevel();
        }
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
    if (activeEditor || isProcessing) return;
    const cell = grid[y]?.[x];
    const isPuzzleBlock =
      cell !== undefined && getBlockProperties(cell, grid)?.canSelect;

    if (grabbed) {
      if (isPuzzleBlock) {
        if (cursor.x === x && cursor.y === y) {
          // 마우스 클릭이나 터치 시 lock 해제 방지
          playSound("select", muted);
        } else {
          setCursor({ x, y });
          setGrabbed(true);
          playSound("select", muted);
        }
      } else {
        const grabbedCell = grid[cursor.y]?.[cursor.x];
        const isVertWall =
          grabbedCell === BLOCK_WALL_V || grabbedCell === BLOCK_AUTO_WALL_V;

        if (x > cursor.x) {
          if (isVertWall) {
            moveBlock(cursor.x, cursor.y, 0, 1);
          } else {
            moveBlock(cursor.x, cursor.y, 1, 0);
          }
        } else if (x < cursor.x) {
          if (isVertWall) {
            moveBlock(cursor.x, cursor.y, 0, -1);
          } else {
            moveBlock(cursor.x, cursor.y, -1, 0);
          }
        } else if (y > cursor.y && isVertWall) {
          moveBlock(cursor.x, cursor.y, 0, 1);
        } else if (y < cursor.y && isVertWall) {
          moveBlock(cursor.x, cursor.y, 0, -1);
        } else {
          // 마우스 클릭이나 터치 시 lock 해제 하지 않음
          playSound("select", muted);
        }
      }
    } else {
      setCursor({ x, y });
      if (isPuzzleBlock) {
        setGrabbed(true);
        playSound("select", muted);
      } else {
        setGrabbed(false);
        playSound("select", muted);
      }
    }
  };

  const handleBackgroundClick = (clientX: number) => {
    if (activeEditor || !grabbed) return;
    const cell = grid[cursor.y]?.[cursor.x];
    const isRight = clientX > window.innerWidth / 2;

    if (cell === BLOCK_WALL_V || cell === BLOCK_AUTO_WALL_V) {
      moveBlock(cursor.x, cursor.y, 0, isRight ? 1 : -1);
    } else {
      moveBlock(cursor.x, cursor.y, isRight ? 1 : -1, 0);
    }
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
    link.download =
      editorMapType === "test" ? "test-map.json" : "real-map.json";
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
    active: isEditor,
    playTestMode: playTestMode,
    handlers: {
      onTogglePlayTest: togglePlayTest,
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
        navigator.clipboard
          .writeText(jsonStr)
          .then(() => {
            toast.openToast("클립보드에 복사되었습니다!");
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
        const prevIdx =
          (idx - 1 + ALL_PAINT_TOOLS.length) % ALL_PAINT_TOOLS.length;
        setSelectedPaint(ALL_PAINT_TOOLS[prevIdx]);
        playSound("select", muted);
      },
      onAddStage: () => {
        editorAddLevel();
      },
    },
  });

  return (
    <div className="flex min-h-full items-center justify-center p-0 md:py-2 md:px-6 bg-[#0f0f10] text-[#f9fafb] overflow-hidden relative font-sans select-none">
      {/* Subtle modern background gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/15 via-zinc-950/20 to-zinc-950 pointer-events-none z-0" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center py-1 md:py-2 px-1 md:px-4">
        {/* Navigation / HUD Bar */}
        <div className="w-full bg-[#17171c]/90 backdrop-blur-md border border-zinc-900 rounded-t-[24px] px-3 md:px-6 py-3 flex items-center justify-between shadow-sm select-none relative z-30">
          {/* STAGE Info */}
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-xs md:text-sm font-bold flex items-center gap-1.5">
              {isEditor ? (
                <>
                  단계{" "}
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
                    className="w-10 bg-zinc-900 border border-zinc-800 text-emerald-400 text-xs font-bold text-center focus:outline-none focus:border-emerald-500 py-0.5 rounded"
                  />{" "}
                  / {editorLevels.length}
                </>
              ) : (
                `STAGE ${levelIndex + 1}`
              )}
            </span>
            {activeEditor && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    playSound("select", muted);
                    selectEditorLevel(editorActiveIndex - 1);
                  }}
                  disabled={editorActiveIndex === 0}
                  className="px-1.5 py-0.5 bg-zinc-805 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 text-[9px] md:text-[10px] rounded cursor-pointer text-white font-bold"
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
                  className="px-1.5 py-0.5 bg-zinc-805 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 text-[9px] md:text-[10px] rounded cursor-pointer text-white font-bold"
                  title="Next Stage"
                >
                  ▶
                </button>
                <button
                  onClick={() => {
                    editorAddLevel();
                  }}
                  className="px-1.5 py-0.5 bg-emerald-800 border border-emerald-700 hover:bg-emerald-700 text-[9px] md:text-[10px] rounded cursor-pointer text-white font-bold"
                  title="Add Stage"
                >
                  ➕
                </button>
                <button
                  onClick={() => {
                    editorDeleteLevel();
                  }}
                  disabled={editorLevels.length <= 1}
                  className="px-1.5 py-0.5 bg-red-800 border border-red-700 hover:bg-red-700 disabled:opacity-40 text-[9px] md:text-[10px] rounded cursor-pointer text-white font-bold"
                  title="Delete Stage"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          {/* Time Left Progress Bar (No text label "제한 시간") */}
          <div className="flex-1 max-w-[140px] sm:max-w-[240px] md:max-w-[340px] mx-2 sm:mx-4 flex items-center gap-1.5 sm:gap-2">
            {activeEditor ? (
              <div className="flex items-center gap-1 justify-center w-full">
                <button
                  onClick={() => {
                    playSound("select", muted);
                    editorUpdateTimeLimit(timeLeft - 10);
                  }}
                  disabled={timeLeft <= 10}
                  className="px-1 py-0.5 bg-zinc-800 border border-zinc-750 rounded text-[9px] md:text-[10px] cursor-pointer text-white font-bold disabled:opacity-40"
                  title="Decrease Time Limit"
                >
                  -10s
                </button>
                <span className="text-yellow-400 text-[10px] md:text-xs font-bold w-10 text-center">
                  {timeLeft}s
                </span>
                <button
                  onClick={() => {
                    playSound("select", muted);
                    editorUpdateTimeLimit(timeLeft + 10);
                  }}
                  className="px-1 py-0.5 bg-zinc-800 border border-zinc-750 rounded text-[9px] md:text-[10px] cursor-pointer text-white font-bold"
                  title="Increase Time Limit"
                >
                  +10s
                </button>
              </div>
            ) : (
              <>
                <span className="text-yellow-400 text-xs font-bold w-10 text-center flex-shrink-0">
                  {timeLeft}s
                </span>
                <div className="flex-1 h-2 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 rounded-full ${
                      timeLeft > 20
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

          {/* Menu Dropdown Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                playSound("select", muted);
              }}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
            >
              ☰ 목록
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-[#1c1c1e] border border-zinc-800 rounded-2xl shadow-2xl z-50 py-1.5 flex flex-col gap-0.5 select-none">
                <button
                  onClick={() => {
                    setGrabbed(false);
                    if (!isEditor && onFullReset) {
                      onFullReset();
                    } else {
                      resetLevel();
                    }
                    playSound("select", muted);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 hover:bg-zinc-800/60 text-left text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  🔄 다시 도전
                </button>

                <button
                  onClick={() => {
                    setMuted(!muted);
                    playSound("select", !muted);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 hover:bg-zinc-800/60 text-left text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  {muted ? "🔊 소리 켜기" : "🔇 음소거"}
                </button>

                {isEditor && (
                  <>
                    <div className="border-t border-zinc-800 my-1" />
                    <div className="px-4 py-1 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-bold">
                        타입
                      </span>
                      <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-lg p-0.5">
                        <button
                          onClick={() => {
                            if (editorMapType !== "real") {
                              setEditorMapType("real");
                              changeMapType("real");
                              playSound("select", muted);
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all cursor-pointer ${
                            editorMapType === "real"
                              ? "bg-zinc-800 text-emerald-400"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          REAL
                        </button>
                        <button
                          onClick={() => {
                            if (editorMapType !== "test") {
                              setEditorMapType("test");
                              changeMapType("test");
                              playSound("select", muted);
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all cursor-pointer ${
                            editorMapType === "test"
                              ? "bg-zinc-800 text-emerald-400"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          TEST
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        togglePlayTest();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 hover:bg-zinc-800/60 text-left text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
                    >
                      {playTestMode ? "⏹ 테스트 중단" : "▶ 레벨 테스트"}
                    </button>
                  </>
                )}

                <div className="border-t border-zinc-800 my-1" />
                <Link
                  href="/home"
                  onClick={() => playSound("select", muted)}
                  className="w-full px-4 py-2 hover:bg-zinc-800/60 text-left text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  ◀ 메인 메뉴로
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Toss Style Game Board Container */}
        <div className="w-full bg-[#17171c] border border-t-0 border-zinc-900 rounded-b-[24px] shadow-2xl py-1 md:py-3 px-1 md:px-6 relative">
          {/* Farm Board Area */}
          <div
            onClick={(e) => {
              if (activeEditor) return;
              handleBackgroundClick(e.clientX);
            }}
            className="farm-grass-bg w-full min-h-[240px] sm:min-h-[300px] md:min-h-[440px] rounded-2xl border border-zinc-800/40 flex flex-col items-center justify-center py-1 md:py-3 px-1 md:px-6 text-white relative shadow-inner"
          >
            {isEditor && (
              <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/50 p-3 rounded-2xl mb-4 flex flex-col shadow-sm">
                <div className="text-[10px] text-zinc-400 font-bold text-center mb-2 uppercase tracking-wider pb-1.5 border-b border-zinc-800/40">
                  제거해야 할 블록
                </div>
                <div className="flex flex-wrap justify-center gap-4 py-1">
                  {Object.keys(blockCounts).length === 0 ? (
                    <div className="text-center text-xs text-zinc-500 font-semibold">
                      남은 블록 없음
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
                          <span className="text-xs text-zinc-300 font-bold">
                            x{count}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            {/* CENTER/RIGHT COLUMN: PLAY BOARD GRID */}
            <GameStageView
              grid={grid}
              cursor={cursor}
              activeEditor={activeEditor}
              playTestMode={playTestMode}
              grabbed={grabbed}
              flashingBlocks={flashingBlocks}
              bullets={bullets}
              firedOnce={firedOnce}
              isLevelCleared={isLevelCleared}
              isGameOver={isGameOver}
              levelIndex={levelIndex}
              isEditor={isEditor}
              muted={muted}
              setGrabbed={setGrabbed}
              loadLevel={loadLevel}
              resetLevel={resetLevel}
              setCursor={setCursor}
              playSound={playSound}
              handleMouseDown={handleMouseDown}
              handleMouseEnter={handleMouseEnter}
              handleCellClick={handleCellClick}
              editorDeleteRow={editorDeleteRow}
              editorDeleteCol={editorDeleteCol}
            />
          </div>
        </div>

        {/* BOTTOM SECTION: EDITOR PALETTE & LEVEL SELECTORS */}
        <div className="w-full md:bg-[#17171c] md:border md:border-t-0 md:border-zinc-900 md:rounded-b-[24px] py-1 md:py-3 px-1 md:px-4 flex flex-col gap-1 md:gap-3 md:shadow-xl">
          {activeEditor ? (
            // Editor Toolbar
            <div className="flex flex-col gap-3 font-sans">
              <div className="text-xs text-zinc-400 border-b border-zinc-800/50 pb-2 flex justify-between items-center font-semibold">
                <span>
                  그리기 도구를 선택하고 격자 셀을 클릭하거나 드래그하여
                  그려보세요.
                </span>
                <span className="text-[#3182f6]">에디터 팔레트</span>
              </div>

              {/* Block Selection Palette */}
              <div className="flex flex-wrap gap-2.5 items-center">
                {/* Eraser */}
                <button
                  onClick={() => setSelectedPaint("eraser")}
                  className={`px-3 py-2 rounded-xl text-xs border cursor-pointer flex items-center gap-1.5 transition-all ${
                    selectedPaint === "eraser"
                      ? "bg-red-600 border-red-700 text-white shadow-lg scale-102 font-bold"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  🧹 지우개
                </button>

                {/* Wall block */}
                <button
                  onClick={() => setSelectedPaint(BLOCK_WALL)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_WALL
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                >
                  <BlockRenderer id={BLOCK_WALL} />
                </button>

                {/* Puzzle blocks */}
                {PUZZLE_BLOCK_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedPaint(type)}
                    className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                      selectedPaint === type
                        ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                        : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                    }`}
                  >
                    <BlockRenderer id={type} />
                  </button>
                ))}

                {/* Bomb block */}
                <button
                  onClick={() => setSelectedPaint(BLOCK_BOMB)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_BOMB
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Bomb Block"
                >
                  <BlockRenderer id={BLOCK_BOMB} />
                </button>

                {/* Moving slider walls */}
                <button
                  onClick={() => setSelectedPaint(BLOCK_WALL_V)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_WALL_V
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Vertical Moving Wall"
                >
                  <BlockRenderer id={BLOCK_WALL_V} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_WALL_H)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_WALL_H
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Horizontal Moving Wall"
                >
                  <BlockRenderer id={BLOCK_WALL_H} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_AUTO_WALL_V)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_AUTO_WALL_V
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Vertical Auto-Moving Wall"
                >
                  <BlockRenderer id={BLOCK_AUTO_WALL_V} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_AUTO_WALL_H)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_AUTO_WALL_H
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Horizontal Auto-Moving Wall"
                >
                  <BlockRenderer id={BLOCK_AUTO_WALL_H} />
                </button>

                {/* Shooter blocks */}
                <button
                  onClick={() => setSelectedPaint(BLOCK_SHOOTER_L)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_SHOOTER_L
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Shooter Left (Repeated)"
                >
                  <BlockRenderer id={BLOCK_SHOOTER_L} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SHOOTER_R)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_SHOOTER_R
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Shooter Right (Repeated)"
                >
                  <BlockRenderer id={BLOCK_SHOOTER_R} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SHOOTER_L_ONCE)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_SHOOTER_L_ONCE
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Shooter Left (Once)"
                >
                  <BlockRenderer id={BLOCK_SHOOTER_L_ONCE} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SHOOTER_R_ONCE)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_SHOOTER_R_ONCE
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Shooter Right (Once)"
                >
                  <BlockRenderer id={BLOCK_SHOOTER_R_ONCE} />
                </button>

                {/* Spike blocks */}
                <button
                  onClick={() => setSelectedPaint(BLOCK_SPIKE_U)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_SPIKE_U
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Spike Up"
                >
                  <BlockRenderer id={BLOCK_SPIKE_U} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SPIKE_D)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_SPIKE_D
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Spike Down"
                >
                  <BlockRenderer id={BLOCK_SPIKE_D} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SPIKE_L)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_SPIKE_L
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Spike Left"
                >
                  <BlockRenderer id={BLOCK_SPIKE_L} />
                </button>
                <button
                  onClick={() => setSelectedPaint(BLOCK_SPIKE_R)}
                  className={`w-9 h-9 p-1 rounded-xl border cursor-pointer transition-all ${
                    selectedPaint === BLOCK_SPIKE_R
                      ? "border-[#3182f6] bg-zinc-900 scale-105 shadow-md"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                  title="Spike Right"
                >
                  <BlockRenderer id={BLOCK_SPIKE_R} />
                </button>
              </div>

              {/* Map actions */}
              <div className="flex flex-wrap justify-between items-center gap-3 mt-2 pt-3 border-t border-zinc-800/60">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Rows / Cols control */}
                  <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-850 text-white select-none">
                    <span className="text-[10px] text-zinc-500 font-bold">
                      행
                    </span>
                    <button
                      onClick={() =>
                        editorResizeGrid(grid.length - 1, grid[0].length)
                      }
                      disabled={grid.length <= 4}
                      className="w-5 h-5 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold rounded-lg"
                    >
                      -
                    </button>
                    <span className="text-xs text-yellow-400 font-bold w-4 text-center">
                      {grid.length}
                    </span>
                    <button
                      onClick={() =>
                        editorResizeGrid(grid.length + 1, grid[0].length)
                      }
                      disabled={grid.length >= 12}
                      className="w-5 h-5 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold rounded-lg"
                    >
                      +
                    </button>

                    <span className="text-zinc-800">|</span>

                    <span className="text-[10px] text-zinc-500 font-bold">
                      열
                    </span>
                    <button
                      onClick={() =>
                        editorResizeGrid(grid.length, grid[0].length - 1)
                      }
                      disabled={grid[0].length <= 4}
                      className="w-5 h-5 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold rounded-lg"
                    >
                      -
                    </button>
                    <span className="text-xs text-yellow-400 font-bold w-4 text-center">
                      {grid[0].length}
                    </span>
                    <button
                      onClick={() =>
                        editorResizeGrid(grid.length, grid[0].length + 1)
                      }
                      disabled={grid[0].length >= 16}
                      className="w-5 h-5 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold rounded-lg"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={editorFillBorder}
                    className="px-3.5 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-900/60 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    🧱 테두리 벽 채우기
                  </button>
                  <button
                    onClick={editorFlipHorizontal}
                    className="px-3.5 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-900/60 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    ↔️ 좌우 뒤집기
                  </button>
                  <button
                    onClick={editorClearGrid}
                    className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/60 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    🗑 격자 비우기
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-850 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    📥 JSON 내보내기
                  </button>
                  <button
                    onClick={() => setExportModalContent("")}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-850 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    📤 JSON 가져오기
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Gameplay Controls & Virtual D-Pad for Mobile
            <div className="flex flex-col gap-4 w-full">
              {/* Desktop keyboard shortcut description */}
              <div className="hidden md:flex items-center justify-center sm:justify-start">
                <div className="text-xs text-zinc-400 leading-relaxed max-w-[500px] text-center sm:text-left font-medium">
                  {playTestMode ? (
                    <span className="text-[#3182f6] font-bold">
                      [테스트 모드] 이동: [방향키] | 블록 선택/해제: [Space] |
                      밀기: [왼쪽/오른쪽 방향키]
                    </span>
                  ) : (
                    <span>
                      선택 이동: [방향키] | 블록 잡기/놓기: [Space] | 블록 밀기:
                      [왼쪽/오른쪽 방향키] | 단계 재시작: [R]
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile Virtual Left/Right Buttons UI */}
              <div className="flex md:hidden items-center justify-center gap-4 py-0 px-2 mt-0.5 w-full select-none">
                {/* Left Button (<-) */}
                <button
                  onClick={() => {
                    if (!grabbed) {
                      playSound("error", muted);
                      return;
                    }
                    const cell = grid[cursor.y]?.[cursor.x];
                    if (cell === BLOCK_WALL_V || cell === BLOCK_AUTO_WALL_V) {
                      moveBlock(cursor.x, cursor.y, 0, -1);
                    } else {
                      moveBlock(cursor.x, cursor.y, -1, 0);
                    }
                  }}
                  className="flex-1 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 active:bg-zinc-750 border border-zinc-800/80 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-300 shadow-sm cursor-pointer transition-transform active:scale-95"
                >
                  ◀
                </button>

                {/* Right Button (->) */}
                <button
                  onClick={() => {
                    if (!grabbed) {
                      playSound("error", muted);
                      return;
                    }
                    const cell = grid[cursor.y]?.[cursor.x];
                    if (cell === BLOCK_WALL_V || cell === BLOCK_AUTO_WALL_V) {
                      moveBlock(cursor.x, cursor.y, 0, 1);
                    } else {
                      moveBlock(cursor.x, cursor.y, 1, 0);
                    }
                  }}
                  className="flex-1 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 active:bg-zinc-750 border border-zinc-800/80 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-300 shadow-sm cursor-pointer transition-transform active:scale-95"
                >
                  ▶
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* JSON Import/Export Modal */}
      {cheaterPopupOpen && (
        <div className="absolute inset-0 bg-[#121214]/85 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-zinc-800/80 rounded-[28px] max-w-md w-full p-6 shadow-2xl relative text-zinc-300 flex flex-col gap-5 text-center animate-slide-up">
            <div className="border-b border-zinc-850 pb-3">
              <h2 className="text-sm font-bold text-red-500 tracking-wide animate-pulse">
                ⚠️ 비정상적인 접근 감지 ⚠️
              </h2>
            </div>

            <div className="text-4xl animate-bounce">😜</div>

            <p className="text-sm font-bold text-yellow-400 uppercase tracking-wide">
              주소창 입력을 통한 스테이지 건너뛰기가 감지되었습니다.
            </p>

            <p className="text-xs text-zinc-400 leading-relaxed">
              잠겨있는 스테이지에는 바로 입장하실 수 없습니다.
              <br />
              <br />
              <span className="text-red-500 font-bold">
                진행 상황 패널티:
              </span>{" "}
              처음 레벨로{" "}
              <span className="text-white font-bold underline">초기화</span>
              됩니다!
            </p>

            <div className="flex justify-center mt-2">
              <button
                onClick={() => {
                  setCheaterPopupOpen(false);
                  playSound("start", muted);
                }}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-xs cursor-pointer border border-red-700 shadow-md transition-all hover:scale-102 active:scale-98 tracking-wider"
              >
                죄송합니다 🥺 (다시 시작)
              </button>
            </div>
          </div>
        </div>
      )}

      {exportModalContent !== null && (
        <div className="absolute inset-0 bg-[#121214]/85 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-zinc-800/80 rounded-[28px] max-w-lg w-full p-6 shadow-2xl relative text-zinc-300 flex flex-col gap-4 animate-slide-up">
            <div className="text-center border-b border-zinc-850 pb-2">
              <h2 className="text-md font-bold text-yellow-400 tracking-wide">
                {exportModalContent.length > 0
                  ? "레벨 데이터 내보내기"
                  : "레벨 데이터 가져오기"}
              </h2>
            </div>

            <p className="text-xs text-zinc-400">
              {exportModalContent.length > 0
                ? "아래의 레벨 데이터 JSON 문자열을 복사하여 저장하거나 공유하세요:"
                : "불러올 레벨 데이터 JSON 문자열을 아래에 붙여넣어 주세요:"}
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
              className="w-full h-32 bg-black/60 border border-zinc-800 rounded-2xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-zinc-700"
              placeholder='[{"name":"LEVEL 1-1","grid":[[0,0,...]],"timeLimit":180}]'
            />

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => {
                  setExportModalContent(null);
                  setImportText("");
                  playSound("select", muted);
                }}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                취소
              </button>

              {exportModalContent.length > 0 ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-[#3182f6] hover:bg-[#1b64da] text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    파일 다운로드
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exportModalContent);
                      toast.openToast("클립보드에 복사되었습니다!");
                      playSound("select", muted);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    텍스트 복사
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    handleImport(importText);
                    setImportText("");
                  }}
                  className="px-4 py-2 bg-[#3182f6] hover:bg-[#1b64da] text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  가져오기
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {toast.toastText && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-zinc-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-full border border-zinc-700/80 shadow-2xl z-50 pointer-events-none transition-all animate-bounce">
          {toast.toastText}
        </div>
      )}
    </div>
  );
}

export default function GameView({ isEditor = false }: GameViewProps) {
  const [resetKey, setResetKey] = useState(0);
  const isLoaded = useBlockImagesPreloader();

  const handleFullReset = () => {
    setResetKey((prev) => prev + 1);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 select-none">
        <div className="flex flex-col items-center gap-4 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <h2 className="text-lg font-bold text-zinc-100 mb-1">
              게임 그래픽 로딩 중...
            </h2>
            <p className="text-xs text-zinc-400">
              모든 블록 리소스를 준비하고 있습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameContent
      key={resetKey}
      isEditor={isEditor}
      onFullReset={handleFullReset}
    />
  );
}
