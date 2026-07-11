"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type CellType =
  | "empty"
  | "wall"
  | "sphere"
  | "diamond"
  | "cube"
  | "cone"
  | "star"
  | "cylinder"
  | "triangle_down";

export interface Position {
  x: number;
  y: number;
}

export interface LevelData {
  name: string;
  grid: CellType[][];
  timeLimit: number;
  retries: number;
}

// Built-in level templates matching classic Puzznic layouts
export const BUILTIN_LEVELS: LevelData[] = [
  {
    name: "LEVEL 1-1",
    timeLimit: 60,
    retries: 2,
    grid: [
      ["wall", "empty", "empty", "empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty", "empty", "sphere", "empty"],
      ["empty", "empty", "empty", "empty", "empty", "diamond", "star", "empty"],
      ["empty", "empty", "empty", "empty", "cube", "cone", "cylinder", "empty"],
      ["empty", "empty", "empty", "diamond", "cone", "cylinder", "triangle_down", "empty"],
      ["empty", "empty", "sphere", "cube", "star", "triangle_down", "empty", "empty"],
    ],
  },
  {
    name: "LEVEL 1-2",
    timeLimit: 90,
    retries: 3,
    grid: [
      ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "wall", "wall", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"],
      ["empty", "sphere", "sphere", "empty", "empty", "diamond", "diamond", "empty"],
      ["empty", "wall", "wall", "cube", "cube", "wall", "wall", "empty"],
      ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"],
      ["empty", "star", "cylinder", "cone", "cone", "cylinder", "star", "empty"],
      ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
    ],
  },
  {
    name: "LEVEL 1-3",
    timeLimit: 120,
    retries: 3,
    grid: [
      ["wall", "empty", "empty", "empty", "empty", "empty", "empty", "wall"],
      ["wall", "empty", "sphere", "empty", "empty", "sphere", "empty", "wall"],
      ["wall", "empty", "wall", "diamond", "diamond", "wall", "empty", "wall"],
      ["wall", "empty", "empty", "empty", "empty", "empty", "empty", "wall"],
      ["wall", "wall", "empty", "cube", "cube", "empty", "wall", "wall"],
      ["wall", "empty", "empty", "empty", "empty", "empty", "empty", "wall"],
      ["wall", "star", "cone", "cylinder", "cylinder", "cone", "star", "wall"],
      ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
    ],
  },
];

// Sound player proxy matching the main application sound synthesis
const playEngineSound = (type: "coin" | "select" | "start" | "error" | "match" | "fall", muted: boolean) => {
  if (muted || typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "match") {
      // Direct high pitched matching bubble sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "fall") {
      // Soft landing click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.setValueAtTime(100, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
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
    console.warn("Audio Context blocked:", e);
  }
};

export const useGameEngine = (initialLevelIndex = 0, isEditorMode = false) => {
  const [levelIndex, setLevelIndex] = useState<number>(initialLevelIndex);
  const [grid, setGrid] = useState<CellType[][]>(() =>
    JSON.parse(JSON.stringify(BUILTIN_LEVELS[initialLevelIndex].grid))
  );
  const [cursor, setCursor] = useState<Position>({ x: 3, y: 7 });
  const [timeLeft, setTimeLeft] = useState<number>(BUILTIN_LEVELS[initialLevelIndex].timeLimit);
  const [retries, setRetries] = useState<number>(BUILTIN_LEVELS[initialLevelIndex].retries);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isLevelCleared, setIsLevelCleared] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [blockCounts, setBlockCounts] = useState<Record<string, number>>({});
  const [muted, setMuted] = useState<boolean>(false);

  const processingRef = useRef(isProcessing);
  processingRef.current = isProcessing;

  // Calculate remaining target blocks on the grid
  const updateBlockCounts = useCallback((board: CellType[][]) => {
    const counts: Record<string, number> = {};
    board.forEach((row) => {
      row.forEach((cell) => {
        if (cell !== "empty" && cell !== "wall") {
          counts[cell] = (counts[cell] || 0) + 1;
        }
      });
    });
    setBlockCounts(counts);
    return counts;
  }, []);

  // Initialize and Reset levels
  const loadLevel = useCallback(
    (levelIdx: number) => {
      if (levelIdx < 0 || levelIdx >= BUILTIN_LEVELS.length) return;
      const level = BUILTIN_LEVELS[levelIdx];
      setLevelIndex(levelIdx);
      setGrid(JSON.parse(JSON.stringify(level.grid)));
      setTimeLeft(level.timeLimit);
      setRetries(level.retries);
      setIsGameOver(false);
      setIsLevelCleared(false);
      setIsProcessing(false);
      setCursor({ x: 3, y: 7 });
      updateBlockCounts(level.grid);
      playEngineSound("start", muted);
    },
    [muted, updateBlockCounts]
  );

  const resetLevel = useCallback(() => {
    if (isEditorMode) {
      // Clear grid for editor
      setGrid(Array.from({ length: 8 }, () => Array(8).fill("empty")));
      setIsLevelCleared(false);
      setIsGameOver(false);
      setIsProcessing(false);
      setBlockCounts({});
    } else {
      loadLevel(levelIndex);
    }
  }, [isEditorMode, levelIndex, loadLevel]);

  // Initial load
  useEffect(() => {
    if (!isEditorMode) {
      loadLevel(initialLevelIndex);
    } else {
      // Empty grid for level editing
      setGrid(Array.from({ length: 8 }, () => Array(8).fill("empty")));
    }
  }, [initialLevelIndex, isEditorMode, loadLevel]);

  // Main countdown timer (Game mode only)
  useEffect(() => {
    if (isEditorMode || isGameOver || isLevelCleared || isProcessing) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGameOver(true);
          playEngineSound("error", muted);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isEditorMode, isGameOver, isLevelCleared, isProcessing, muted]);

  // Physics step resolution logic (runs sequentially for animations)
  const runPhysicsLoop = useCallback(
    async (startGrid: CellType[][]) => {
      setIsProcessing(true);
      let currentGrid = startGrid.map((row) => [...row]);
      let keepGoing = true;

      // Auxiliary delay helper for animation frames
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      while (keepGoing) {
        // 1. Gravity phase
        let gravityChanged = false;
        const nextGravityGrid = currentGrid.map((row) => [...row]);

        // Process from bottom to top so multiple blocks can drop simultaneously
        for (let y = grid.length - 2; y >= 0; y--) {
          for (let x = 0; x < grid[y].length; x++) {
            const cell = nextGravityGrid[y][x];
            if (cell !== "empty" && cell !== "wall") {
              if (nextGravityGrid[y + 1][x] === "empty") {
                nextGravityGrid[y + 1][x] = cell;
                nextGravityGrid[y][x] = "empty";
                gravityChanged = true;
              }
            }
          }
        }

        if (gravityChanged) {
          currentGrid = nextGravityGrid;
          setGrid(currentGrid);
          updateBlockCounts(currentGrid);
          playEngineSound("fall", muted);
          await delay(200); // falling animation duration
          continue; // Re-evaluate gravity until stable
        }

        // 2. Match Phase (2 or more adjacent identical blocks touch)
        let matchChanged = false;
        const nextMatchGrid = currentGrid.map((row) => [...row]);
        const toClear = Array.from({ length: grid.length }, () => Array(grid[0].length).fill(false));

        const dy = [-1, 1, 0, 0];
        const dx = [0, 0, -1, 1];

        for (let y = 0; y < grid.length; y++) {
          for (let x = 0; x < grid[y].length; x++) {
            const cell = currentGrid[y][x];
            if (cell !== "empty" && cell !== "wall") {
              // Check neighbors
              for (let i = 0; i < 4; i++) {
                const ny = y + dy[i];
                const nx = x + dx[i];
                if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
                  if (currentGrid[ny][nx] === cell) {
                    toClear[y][x] = true;
                    toClear[ny][nx] = true;
                    matchChanged = true;
                  }
                }
              }
            }
          }
        }

        if (matchChanged) {
          for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[0].length; x++) {
              if (toClear[y][x]) {
                nextMatchGrid[y][x] = "empty";
              }
            }
          }
          currentGrid = nextMatchGrid;
          setGrid(currentGrid);
          updateBlockCounts(currentGrid);
          playEngineSound("match", muted);
          await delay(250); // Matching explode animation duration
          continue; // Loop back to gravity check to drop blocks that were held
        }

        // Neither gravity nor matches occurred, physics is stable
        keepGoing = false;
      }

      // Check win/lose conditions after resolution
      const finalCounts = updateBlockCounts(currentGrid);
      const remainingBlocks = Object.values(finalCounts).reduce((a, b) => a + b, 0);

      if (remainingBlocks === 0 && !isEditorMode) {
        setIsLevelCleared(true);
        playEngineSound("start", muted);
      } else if (!isEditorMode) {
        // Detect if any legal matches are still possible, otherwise warn player/prompt retry
        // In this implementation, we allow the user to retry if they get stuck.
      }

      setIsProcessing(false);
    },
    [grid.length, isEditorMode, muted, updateBlockCounts]
  );

  // Move Block left or right
  const moveBlock = useCallback(
    (x: number, y: number, direction: -1 | 1) => {
      if (isProcessing || isGameOver || isLevelCleared || isEditorMode) return;

      const block = grid[y][x];
      if (block === "empty" || block === "wall") {
        playEngineSound("error", muted);
        return;
      }

      const tx = x + direction;
      if (tx < 0 || tx >= grid[0].length) {
        playEngineSound("error", muted);
        return;
      }

      if (grid[y][tx] !== "empty") {
        playEngineSound("error", muted);
        return; // Destination blocked
      }

      // Execute shift
      const nextGrid = grid.map((row) => [...row]);
      nextGrid[y][tx] = block;
      nextGrid[y][x] = "empty";

      setGrid(nextGrid);
      setCursor({ x: tx, y });
      playEngineSound("select", muted);

      // Start physics solver
      runPhysicsLoop(nextGrid);
    },
    [grid, isProcessing, isGameOver, isLevelCleared, isEditorMode, runPhysicsLoop, muted]
  );

  // Level Editor Grid modification methods
  const editorPlaceBlock = useCallback(
    (x: number, y: number, blockType: CellType) => {
      if (!isEditorMode) return;
      const nextGrid = grid.map((row) => [...row]);
      nextGrid[y][x] = blockType;
      setGrid(nextGrid);
      updateBlockCounts(nextGrid);
      playEngineSound("select", muted);
    },
    [grid, isEditorMode, updateBlockCounts, muted]
  );

  const editorClearGrid = useCallback(() => {
    if (!isEditorMode) return;
    const newGrid = Array.from({ length: 8 }, () => Array(8).fill("empty"));
    setGrid(newGrid);
    setBlockCounts({});
    playEngineSound("error", muted);
  }, [isEditorMode, muted]);

  return {
    grid,
    setGrid,
    cursor,
    setCursor,
    timeLeft,
    setTimeLeft,
    retries,
    setRetries,
    isGameOver,
    setIsGameOver,
    isLevelCleared,
    setIsLevelCleared,
    isProcessing,
    blockCounts,
    levelIndex,
    loadLevel,
    resetLevel,
    moveBlock,
    editorPlaceBlock,
    editorClearGrid,
    muted,
    setMuted,
  };
};
