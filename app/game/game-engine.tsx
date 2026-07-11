"use client";

import { useState, useEffect, useCallback } from "react";
import realMap from "../level/real-map.json";

import {
  BlockId,
  BLOCK_EMPTY,
  BLOCK_WALL,
} from "../object/constants";

export type CellType = BlockId;

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

// Load level templates from JSON file
export const BUILTIN_LEVELS: LevelData[] = realMap as LevelData[];


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
    isEditorMode
      ? Array.from({ length: 8 }, () => Array(8).fill(BLOCK_EMPTY))
      : JSON.parse(JSON.stringify(BUILTIN_LEVELS[initialLevelIndex].grid))
  );
  const [cursor, setCursor] = useState<Position>(() =>
    isEditorMode
      ? { x: 3, y: 7 }
      : {
          x: Math.floor(BUILTIN_LEVELS[initialLevelIndex].grid[0].length / 2),
          y: BUILTIN_LEVELS[initialLevelIndex].grid.length - 1,
        }
  );
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    isEditorMode ? 90 : BUILTIN_LEVELS[initialLevelIndex].timeLimit
  );
  const [retries, setRetries] = useState<number>(() =>
    isEditorMode ? 3 : BUILTIN_LEVELS[initialLevelIndex].retries
  );
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isLevelCleared, setIsLevelCleared] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [grabbed, setGrabbed] = useState<boolean>(false);

  const [blockCounts, setBlockCounts] = useState<Record<string, number>>(() => {
    const initialGrid = isEditorMode
      ? Array.from({ length: 8 }, () => Array(8).fill(BLOCK_EMPTY))
      : BUILTIN_LEVELS[initialLevelIndex].grid;
    const counts: Record<string, number> = {};
    initialGrid.forEach((row) => {
      row.forEach((cell) => {
        if (cell !== BLOCK_EMPTY && cell !== BLOCK_WALL) {
          counts[cell] = (counts[cell] || 0) + 1;
        }
      });
    });
    return counts;
  });

  // Calculate remaining target blocks on the grid
  const updateBlockCounts = useCallback((board: CellType[][]) => {
    const counts: Record<string, number> = {};
    board.forEach((row) => {
      row.forEach((cell) => {
        if (cell !== BLOCK_EMPTY && cell !== BLOCK_WALL) {
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
      setCursor({
        x: Math.floor(level.grid[0].length / 2),
        y: level.grid.length - 1,
      });
      setGrabbed(false);
      updateBlockCounts(level.grid);
      playEngineSound("start", muted);
    },
    [muted, updateBlockCounts, setGrabbed]
  );

  const resetLevel = useCallback(() => {
    setGrabbed(false);
    if (isEditorMode) {
      // Clear grid for editor
      setGrid(Array.from({ length: 8 }, () => Array(8).fill(BLOCK_EMPTY)));
      setIsLevelCleared(false);
      setIsGameOver(false);
      setIsProcessing(false);
      setBlockCounts({});
    } else {
      loadLevel(levelIndex);
    }
  }, [isEditorMode, levelIndex, loadLevel, setBlockCounts, setGrabbed]);

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
    async (startGrid: CellType[][], checkX?: number, checkY?: number) => {
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
        for (let y = currentGrid.length - 2; y >= 0; y--) {
          for (let x = 0; x < currentGrid[y].length; x++) {
            const cell = nextGravityGrid[y][x];
            if (cell !== BLOCK_EMPTY && cell !== BLOCK_WALL) {
              if (nextGravityGrid[y + 1][x] === BLOCK_EMPTY) {
                nextGravityGrid[y + 1][x] = cell;
                nextGravityGrid[y][x] = BLOCK_EMPTY;
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
        const toClear = Array.from({ length: currentGrid.length }, () => Array(currentGrid[0].length).fill(false));

        const dy = [-1, 1, 0, 0];
        const dx = [0, 0, -1, 1];

        for (let y = 0; y < currentGrid.length; y++) {
          for (let x = 0; x < currentGrid[y].length; x++) {
            const cell = currentGrid[y][x];
            if (cell !== BLOCK_EMPTY && cell !== BLOCK_WALL) {
              // Check neighbors
              for (let i = 0; i < 4; i++) {
                const ny = y + dy[i];
                const nx = x + dx[i];
                if (ny >= 0 && ny < currentGrid.length && nx >= 0 && nx < currentGrid[0].length) {
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
          for (let y = 0; y < currentGrid.length; y++) {
            for (let x = 0; x < currentGrid[0].length; x++) {
              if (toClear[y][x]) {
                nextMatchGrid[y][x] = BLOCK_EMPTY;
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

      // Maintain lock state after move settles, but release if block is gone (e.g. matched or fell)
      if (checkX !== undefined && checkY !== undefined) {
        const cell = currentGrid[checkY][checkX];
        if (cell === BLOCK_EMPTY || cell === BLOCK_WALL) {
          setGrabbed(false);
        }
      }

      setIsProcessing(false);
    },
    [isEditorMode, muted, updateBlockCounts, setGrabbed]
  );

  // Move Block left or right
  const moveBlock = useCallback(
    (x: number, y: number, direction: -1 | 1) => {
      if (isProcessing || isGameOver || isLevelCleared || isEditorMode) return;

      const block = grid[y][x];
      if (block === BLOCK_EMPTY || block === BLOCK_WALL) {
        playEngineSound("error", muted);
        return;
      }

      const tx = x + direction;
      if (tx < 0 || tx >= grid[0].length) {
        playEngineSound("error", muted);
        return;
      }

      if (grid[y][tx] !== BLOCK_EMPTY) {
        playEngineSound("error", muted);
        return; // Destination blocked
      }

      // Execute shift
      const nextGrid = grid.map((row) => [...row]);
      nextGrid[y][tx] = block;
      nextGrid[y][x] = BLOCK_EMPTY;

      setGrid(nextGrid);
      setCursor({ x: tx, y });
      playEngineSound("select", muted);

      // Start physics solver
      runPhysicsLoop(nextGrid, tx, y);
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
    setGrabbed(false);
    const newGrid = Array.from({ length: 8 }, () => Array(8).fill(BLOCK_EMPTY));
    setGrid(newGrid);
    setBlockCounts({});
    playEngineSound("error", muted);
  }, [isEditorMode, muted, setBlockCounts, setGrabbed]);

  const editorResizeGrid = useCallback((newRows: number, newCols: number) => {
    if (!isEditorMode) return;
    const rows = Math.max(4, Math.min(12, newRows));
    const cols = Math.max(4, Math.min(16, newCols));

    setGrid((prevGrid) => {
      const currentRows = prevGrid.length;
      const currentCols = prevGrid[0]?.length || 0;

      let nextGrid = prevGrid.map((row) => [...row]);

      // Resize rows
      if (rows > currentRows) {
        for (let i = currentRows; i < rows; i++) {
          nextGrid.push(Array(currentCols).fill(BLOCK_EMPTY));
        }
      } else if (rows < currentRows) {
        nextGrid = nextGrid.slice(0, rows);
      }

      // Resize columns
      nextGrid = nextGrid.map((row) => {
        if (cols > currentCols) {
          return [...row, ...Array(cols - currentCols).fill(BLOCK_EMPTY)];
        } else {
          return row.slice(0, cols);
        }
      });

      // Clamp cursor position
      setCursor((prev) => ({
        x: Math.max(0, Math.min(cols - 1, prev.x)),
        y: Math.max(0, Math.min(rows - 1, prev.y)),
      }));

      updateBlockCounts(nextGrid);
      return nextGrid;
    });
  }, [isEditorMode, updateBlockCounts]);

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
    editorResizeGrid,
    muted,
    setMuted,
    grabbed,
    setGrabbed,
  };
};
