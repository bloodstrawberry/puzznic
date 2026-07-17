"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGameEngine, CellType, BUILTIN_LEVELS } from "./game-engine";
import GameStageView from "./game-stage-view";
import Link from "next/link";
import { useEditorHotkeys, ALL_PAINT_TOOLS } from "./hot-key";
import { useToast } from "@toss/tds-mobile";
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

  const handleDpadDirection = (direction: "up" | "down" | "left" | "right") => {
    const {
      grid: curGrid,
      cursor: curCursor,
      grabbed: curGrabbed,
      isGameOver: curGameOver,
      isLevelCleared: curLevelCleared,
      activeEditor: curActiveEditor,
      muted: curMuted,
      moveBlock: curMoveBlock,
      setCursor: curSetCursor,
    } = gameViewRef.current;

    if (curLevelCleared || curActiveEditor || curGameOver) return;

    let dx = 0;
    let dy = 0;

    if (direction === "left") dx = -1;
    else if (direction === "right") dx = 1;
    else if (direction === "up") dy = -1;
    else if (direction === "down") dy = 1;

    // Grabbing state
    if (curGrabbed) {
      const cell = curGrid[curCursor.y]?.[curCursor.x];
      if (cell === BLOCK_WALL_V) {
        if (direction === "up") {
          curMoveBlock(curCursor.x, curCursor.y, 0, -1);
        } else if (direction === "down") {
          curMoveBlock(curCursor.x, curCursor.y, 0, 1);
        } else {
          playSound("error", curMuted);
        }
      } else {
        if (direction === "left") {
          curMoveBlock(curCursor.x, curCursor.y, -1, 0);
        } else if (direction === "right") {
          curMoveBlock(curCursor.x, curCursor.y, 1, 0);
        } else {
          playSound("error", curMuted);
        }
      }
    } else {
      // Normal moving selection cursor
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

  const handleDpadGrab = () => {
    const {
      grid: curGrid,
      cursor: curCursor,
      grabbed: curGrabbed,
      isGameOver: curGameOver,
      isLevelCleared: curLevelCleared,
      activeEditor: curActiveEditor,
      muted: curMuted,
      setGrabbed: curSetGrabbed,
    } = gameViewRef.current;

    if (curLevelCleared || curActiveEditor || curGameOver) return;

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
  };

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
    <div className="flex min-h-screen items-center justify-center p-0 md:p-6 bg-[#0f0f10] text-[#f9fafb] overflow-hidden relative font-sans select-none">
      {/* Subtle modern background gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/15 via-zinc-950/20 to-zinc-950 pointer-events-none z-0" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center p-2 md:p-4">
        {/* Navigation Bar */}
        <div className="w-full bg-[#17171c]/90 backdrop-blur-md border border-zinc-900 rounded-t-[24px] px-4 md:px-6 py-4 flex items-center justify-between shadow-sm select-none">
          <div className="flex gap-4 items-center">
            <Link
              href="/home"
              onClick={() => playSound("select", muted)}
              className="text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              ◀ 메인 메뉴로
            </Link>
            <span className="text-xs text-zinc-700">|</span>
            <span className="text-zinc-300 text-xs font-semibold">
              {isEditor
                ? playTestMode
                  ? "맵 에디터 (테스트 중)"
                  : "맵 에디터 모드"
                : "퍼즐 플레이"}
            </span>
          </div>

          <div className="flex gap-4 items-center">
            {isEditor && (
              <button
                onClick={togglePlayTest}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                  playTestMode
                    ? "bg-red-600 hover:bg-red-500 border-red-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 border-emerald-700 text-white animate-pulse"
                }`}
              >
                {playTestMode ? "⏹ 테스트 중단" : "▶ 레벨 테스트"}
              </button>
            )}
            <button
              onClick={() => {
                setGrabbed(false);
                if (!isEditor && onFullReset) {
                  onFullReset();
                } else {
                  resetLevel();
                }
                playSound("select", muted);
              }}
              className="text-zinc-400 hover:text-zinc-200 text-xs font-semibold cursor-pointer focus:outline-none flex items-center gap-1"
            >
              🔄 다시 도전
            </button>
            <span className="text-xs text-zinc-700">|</span>
            <button
              onClick={() => setMuted(!muted)}
              className="text-zinc-400 hover:text-zinc-200 text-xs font-semibold cursor-pointer focus:outline-none"
            >
              {muted ? "🔊 소리 켜기" : "🔇 음소거"}
            </button>
          </div>
        </div>

        {/* Toss Style Game Board Container */}
        <div className="w-full bg-[#17171c] border border-t-0 border-zinc-900 rounded-b-[24px] shadow-2xl p-2 md:p-6 relative">
          {/* Farm Board Area */}
          <div className="farm-grass-bg w-full min-h-[480px] rounded-2xl border border-zinc-800/40 flex flex-col md:flex-row p-4 md:p-6 text-white relative shadow-inner">
            {/* LEFT COLUMN: STATS AND HUD */}
            <div className="w-full md:w-[260px] flex flex-col justify-between pr-0 md:pr-4 border-b md:border-b-0 md:border-r border-zinc-800/40 pb-4 md:pb-0 md:mr-6">
              {/* Retro HUD stats */}
              <div className="flex flex-col gap-4 text-xs text-zinc-400">
                <div className="flex flex-col gap-1">
                  <span className="text-[#3182f6] font-semibold tracking-wider">
                    PLAYER 1
                  </span>
                  <span className="text-white text-lg font-bold tracking-wider">
                    0
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-zinc-400 font-medium">STAGE</span>
                  <span className="text-emerald-400 text-sm font-bold flex items-center gap-1.5">
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
                          onBlur={(e) =>
                            handleStageInputChange(e.currentTarget)
                          }
                          className="w-10 bg-zinc-900 border border-zinc-800 text-emerald-400 text-xs font-bold text-center focus:outline-none focus:border-emerald-500 py-0.5 rounded"
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
                        className="px-2 py-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 text-[10px] rounded-lg cursor-pointer text-white font-bold"
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
                        className="px-2 py-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 text-[10px] rounded-lg cursor-pointer text-white font-bold"
                        title="Next Stage"
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => {
                          editorAddLevel();
                        }}
                        className="px-2 py-1 bg-emerald-800 border border-emerald-700 hover:bg-emerald-700 text-[10px] rounded-lg cursor-pointer text-white font-bold"
                        title="Add Stage"
                      >
                        ➕
                      </button>
                      <button
                        onClick={() => {
                          editorDeleteLevel();
                        }}
                        disabled={editorLevels.length <= 1}
                        className="px-2 py-1 bg-red-800 border border-red-700 hover:bg-red-700 disabled:opacity-40 text-[10px] rounded-lg cursor-pointer text-white font-bold"
                        title="Delete Stage"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-[10px]">
                      {isEditor ? "[테스트 모드]" : `[1-${levelIndex + 1}]`}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-zinc-400 font-medium">제한 시간</span>
                  <div className="flex items-center gap-1.5">
                    {activeEditor ? (
                      <>
                        <button
                          onClick={() => {
                            playSound("select", muted);
                            editorUpdateTimeLimit(timeLeft - 10);
                          }}
                          disabled={timeLeft <= 10}
                          className="px-2 py-1 bg-zinc-850 border border-zinc-800 rounded-lg text-[10px] cursor-pointer text-white font-bold disabled:opacity-40"
                          title="Decrease Time Limit"
                        >
                          -10초
                        </button>
                        <span className="text-yellow-400 text-xs font-bold w-12 text-center">
                          {timeLeft}초
                        </span>
                        <button
                          onClick={() => {
                            playSound("select", muted);
                            editorUpdateTimeLimit(timeLeft + 10);
                          }}
                          className="px-2 py-1 bg-zinc-850 border border-zinc-800 rounded-lg text-[10px] cursor-pointer text-white font-bold"
                          title="Increase Time Limit"
                        >
                          +10초
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-yellow-400 text-xs font-bold w-10 text-center">
                          {timeLeft}초
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
                </div>
              </div>

              {/* Target Blocks box */}
              <div className="flex-1 flex flex-col justify-end mt-4">
                <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-[20px] flex flex-col min-h-[160px] shadow-sm">
                  <div className="text-[11px] text-zinc-400 font-bold text-center mb-3 uppercase tracking-wider border-b border-zinc-800/40 pb-2">
                    제거해야 할 블록
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-3.5 mt-1 overflow-y-auto max-h-[160px] pr-1">
                    {Object.keys(blockCounts).length === 0 ? (
                      <div className="col-span-2 text-center text-xs text-zinc-500 mt-6 font-semibold">
                        남은 블록 없음
                      </div>
                    ) : (
                      Object.entries(blockCounts).map(([typeStr, count]) => {
                        const type = Number(typeStr);
                        const isCleared = count === 0;
                        return (
                          <div
                            key={type}
                            className={`flex items-center gap-2 ${isCleared ? "opacity-25 line-through" : ""}`}
                          >
                            <div className="w-6 h-6 flex-shrink-0">
                              <BlockRenderer id={type} />
                            </div>
                            <span className="text-[12px] text-zinc-300 font-bold">
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
            <GameStageView
              grid={grid}
              cursor={cursor}
              activeEditor={activeEditor}
              playTestMode={playTestMode}
              grabbed={grabbed}
              flashingBlocks={flashingBlocks}
              bullets={bullets}
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
        <div className="w-full bg-[#17171c] border border-t-0 border-zinc-900 rounded-b-[24px] p-4 flex flex-col gap-4 shadow-xl">
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

              {/* Mobile Virtual D-Pad UI */}
              <div className="flex md:hidden items-center justify-center gap-6 py-4 bg-zinc-900/30 border border-zinc-900 rounded-[24px] px-5 mt-1">
                {/* Cross Direction Buttons */}
                <div className="relative w-28 h-28 flex items-center justify-center bg-zinc-950/60 rounded-full border border-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                  {/* Up */}
                  <button
                    onClick={() => handleDpadDirection("up")}
                    className="absolute top-1 w-9 h-9 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-750 border border-zinc-800 rounded-xl flex items-center justify-center text-xs cursor-pointer font-bold text-zinc-300 shadow"
                  >
                    ▲
                  </button>
                  {/* Left */}
                  <button
                    onClick={() => handleDpadDirection("left")}
                    className="absolute left-1 w-9 h-9 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-750 border border-zinc-800 rounded-xl flex items-center justify-center text-xs cursor-pointer font-bold text-zinc-300 shadow"
                  >
                    ◀
                  </button>
                  {/* Center deco */}
                  <div className="w-8 h-8 bg-zinc-950 border border-zinc-900 rounded-full z-0 flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-2 bg-zinc-800 rounded-full" />
                  </div>
                  {/* Right */}
                  <button
                    onClick={() => handleDpadDirection("right")}
                    className="absolute right-1 w-9 h-9 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-750 border border-zinc-800 rounded-xl flex items-center justify-center text-xs cursor-pointer font-bold text-zinc-300 shadow"
                  >
                    ▶
                  </button>
                  {/* Down */}
                  <button
                    onClick={() => handleDpadDirection("down")}
                    className="absolute bottom-1 w-9 h-9 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-750 border border-zinc-800 rounded-xl flex items-center justify-center text-xs cursor-pointer font-bold text-zinc-300 shadow"
                  >
                    ▼
                  </button>
                </div>

                {/* GRAB Button */}
                <div className="flex flex-col items-center justify-center">
                  <button
                    onClick={handleDpadGrab}
                    className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 font-bold cursor-pointer transition-all shadow-lg active:scale-95 ${
                      grabbed
                        ? "bg-emerald-500 border-emerald-600 hover:bg-emerald-450 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                        : "bg-[#3182f6] border-[#2272e6] hover:bg-[#1b64da] text-white"
                    }`}
                  >
                    <span className="text-[13px] tracking-wide font-bold">
                      {grabbed ? "놓기" : "잡기"}
                    </span>
                    <span className="text-[8px] text-zinc-300 mt-0.5 font-normal tracking-wide">
                      {grabbed ? "RELEASE" : "SPACE"}
                    </span>
                  </button>
                </div>
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
    </div>
  );
}

export default function GameView({ isEditor = false }: GameViewProps) {
  const [resetKey, setResetKey] = useState(0);

  const handleFullReset = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <GameContent
      key={resetKey}
      isEditor={isEditor}
      onFullReset={handleFullReset}
    />
  );
}
