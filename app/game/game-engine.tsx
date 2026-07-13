"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import realMap from "../level/real-map.json";

import {
  BlockId,
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
let sharedAudioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!sharedAudioContext) {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioContext = new AudioContextClass();
    }
  }
  return sharedAudioContext;
};

const copyGrid = (src: CellType[][]): CellType[][] => {
  return src.map((row) => [...row]);
};

const playEngineSound = (
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
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

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
    console.warn("Audio Context blocked:", e);
  }
};

export const SHOOTER_INTERVAL = 1000;

export interface Bullet {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  dir: number;
}

const isNonWallBlock = (id: BlockId): boolean => {
  return (
    id !== BLOCK_EMPTY &&
    id !== BLOCK_WALL &&
    id !== BLOCK_WALL_V &&
    id !== BLOCK_WALL_H &&
    id !== BLOCK_AUTO_WALL_V &&
    id !== BLOCK_AUTO_WALL_H &&
    id !== BLOCK_SHOOTER_L &&
    id !== BLOCK_SHOOTER_R &&
    id !== BLOCK_SHOOTER_L_ONCE &&
    id !== BLOCK_SHOOTER_R_ONCE &&
    id !== BLOCK_SPIKE_U &&
    id !== BLOCK_SPIKE_D &&
    id !== BLOCK_SPIKE_L &&
    id !== BLOCK_SPIKE_R
  );
};

export const useGameEngine = (initialLevelIndex = 0, isEditorMode = false) => {
  const [levelIndex, setLevelIndex] = useState<number>(initialLevelIndex);
  const autoWallDirections = useRef<Record<string, number>>({});
  const [grid, setGrid] = useState<CellType[][]>(() =>
    isEditorMode
      ? Array.from({ length: 8 }, () => Array(8).fill(BLOCK_EMPTY))
      : copyGrid(BUILTIN_LEVELS[initialLevelIndex].grid),
  );
  const [cursor, setCursor] = useState<Position>(() =>
    isEditorMode
      ? { x: 3, y: 7 }
      : {
          x: Math.floor(BUILTIN_LEVELS[initialLevelIndex].grid[0].length / 2),
          y: BUILTIN_LEVELS[initialLevelIndex].grid.length - 1,
        },
  );
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    isEditorMode ? 90 : BUILTIN_LEVELS[initialLevelIndex].timeLimit,
  );
  const [retries, setRetries] = useState<number>(() =>
    isEditorMode ? 3 : BUILTIN_LEVELS[initialLevelIndex].retries,
  );
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isLevelCleared, setIsLevelCleared] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [grabbed, setGrabbed] = useState<boolean>(false);
  const [hasMovedFirstBlock, setHasMovedFirstBlock] = useState<boolean>(false);
  const [flashingBlocks, setFlashingBlocks] = useState<Record<string, boolean>>(
    {},
  );
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const firedOnceRef = useRef<Record<string, boolean>>({});
  const cooldownsRef = useRef<Record<string, number>>({});

  const triggerShotRef = useRef<
    (
      x: number,
      y: number,
      dirX: number,
      curGrid: CellType[][],
      curMuted: boolean,
    ) => void
  >(() => {});

  const stateRef = useRef<{
    grid: CellType[][];
    cursor: Position;
    isProcessing: boolean;
    isGameOver: boolean;
    isLevelCleared: boolean;
    hasMovedFirstBlock: boolean;
    isEditorMode: boolean;
    muted: boolean;
    triggerShot: (
      x: number,
      y: number,
      dirX: number,
      curGrid: CellType[][],
      curMuted: boolean,
    ) => void;
  }>({
    grid: [],
    cursor: { x: 0, y: 0 },
    isProcessing: false,
    isGameOver: false,
    isLevelCleared: false,
    hasMovedFirstBlock: false,
    isEditorMode: false,
    muted: false,
    triggerShot: (x, y, dirX, curGrid, curMuted) =>
      triggerShotRef.current(x, y, dirX, curGrid, curMuted),
  });

  useEffect(() => {
    stateRef.current = {
      grid,
      cursor,
      isProcessing,
      isGameOver,
      isLevelCleared,
      hasMovedFirstBlock,
      isEditorMode,
      muted,
      triggerShot: (x, y, dirX, curGrid, curMuted) =>
        triggerShotRef.current(x, y, dirX, curGrid, curMuted),
    };
  }, [
    grid,
    cursor,
    isProcessing,
    isGameOver,
    isLevelCleared,
    hasMovedFirstBlock,
    isEditorMode,
    muted,
  ]);

  const editorSavedGrid = useRef<CellType[][] | null>(null);

  const [blockCounts, setBlockCounts] = useState<Record<string, number>>(() => {
    const initialGrid = isEditorMode
      ? Array.from({ length: 8 }, () => Array(8).fill(BLOCK_EMPTY))
      : BUILTIN_LEVELS[initialLevelIndex].grid;
    const counts: Record<string, number> = {};
    initialGrid.forEach((row) => {
      row.forEach((cell) => {
        if (isNonWallBlock(cell)) {
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
        if (isNonWallBlock(cell)) {
          counts[cell] = (counts[cell] || 0) + 1;
        }
      });
    });
    setBlockCounts(counts);
    return counts;
  }, []);

  const wasEditorModeRef = useRef<boolean>(isEditorMode);

  // Keep editor original grid in sync when in editor mode
  useEffect(() => {
    if (isEditorMode) {
      if (wasEditorModeRef.current) {
        editorSavedGrid.current = copyGrid(grid);
      }
    }
    wasEditorModeRef.current = isEditorMode;
  }, [grid, isEditorMode]);

  // Restore editor original grid and reset game states when returning to editor mode
  useEffect(() => {
    if (isEditorMode) {
      if (editorSavedGrid.current) {
        setGrid(copyGrid(editorSavedGrid.current));
        updateBlockCounts(editorSavedGrid.current);
      }
      setIsGameOver(false);
      setIsLevelCleared(false);
      setIsProcessing(false);
      setBullets([]);
      setFlashingBlocks({});
      setHasMovedFirstBlock(false);
      setGrabbed(false);
    }
  }, [isEditorMode, updateBlockCounts, setGrabbed]);

  // Initialize and Reset levels
  const loadLevel = useCallback(
    (levelIdx: number) => {
      if (levelIdx < 0 || levelIdx >= BUILTIN_LEVELS.length) return;
      const level = BUILTIN_LEVELS[levelIdx];
      setLevelIndex(levelIdx);
      setGrid(copyGrid(level.grid));
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
      setFlashingBlocks({});
      setBullets([]);
      firedOnceRef.current = {};
      cooldownsRef.current = {};
      autoWallDirections.current = {};
      setHasMovedFirstBlock(false);
      updateBlockCounts(level.grid);
      playEngineSound("start", muted);
    },
    [muted, updateBlockCounts, setGrabbed],
  );

  const resetLevel = useCallback(() => {
    setGrabbed(false);
    setFlashingBlocks({});
    setBullets([]);
    firedOnceRef.current = {};
    cooldownsRef.current = {};
    autoWallDirections.current = {};
    setHasMovedFirstBlock(false);
    if (isEditorMode) {
      // Clear grid for editor
      const emptyGrid = Array.from({ length: 8 }, () =>
        Array(8).fill(BLOCK_EMPTY),
      );
      setGrid(emptyGrid);
      editorSavedGrid.current = emptyGrid;
      setIsLevelCleared(false);
      setIsGameOver(false);
      setIsProcessing(false);
      setBlockCounts({});
    } else if (editorSavedGrid.current) {
      // We are in playtest mode (isEditorMode is false, but editorSavedGrid exists)
      setGrid(copyGrid(editorSavedGrid.current));
      setIsLevelCleared(false);
      setIsGameOver(false);
      setIsProcessing(false);
      updateBlockCounts(editorSavedGrid.current);
    } else {
      loadLevel(levelIndex);
    }
  }, [
    isEditorMode,
    levelIndex,
    loadLevel,
    setBlockCounts,
    setGrabbed,
    updateBlockCounts,
  ]);

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
      if (stateRef.current) stateRef.current.isProcessing = true;
      let currentGrid = copyGrid(startGrid);
      if (stateRef.current) stateRef.current.grid = currentGrid;
      let keepGoing = true;

      // Auxiliary delay helper for animation frames
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      while (keepGoing) {
        // 1. Gravity phase
        let gravityChanged = false;
        const nextGravityGrid = copyGrid(currentGrid);

        // Process from bottom to top so multiple blocks can drop simultaneously
        for (let y = currentGrid.length - 2; y >= 0; y--) {
          for (let x = 0; x < currentGrid[y].length; x++) {
            const cell = nextGravityGrid[y][x];
            if (isNonWallBlock(cell)) {
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
          if (stateRef.current) stateRef.current.grid = currentGrid;
          updateBlockCounts(currentGrid);
          playEngineSound("fall", muted);
          await delay(200); // falling animation duration
          if (stateRef.current?.grid) {
            currentGrid = copyGrid(stateRef.current.grid);
          }
          continue; // Re-evaluate gravity until stable
        }

        // 1.5 Spike check phase
        let spikeDestroyed = false;
        const nextSpikeGrid = copyGrid(currentGrid);
        for (let y = 0; y < currentGrid.length; y++) {
          for (let x = 0; x < currentGrid[y].length; x++) {
            const cell = currentGrid[y][x];
            if (cell === BLOCK_SPIKE_U) {
              if (y > 0 && isNonWallBlock(nextSpikeGrid[y - 1][x])) {
                nextSpikeGrid[y - 1][x] = BLOCK_EMPTY;
                spikeDestroyed = true;
              }
            } else if (cell === BLOCK_SPIKE_D) {
              if (y < currentGrid.length - 1 && isNonWallBlock(nextSpikeGrid[y + 1][x])) {
                nextSpikeGrid[y + 1][x] = BLOCK_EMPTY;
                spikeDestroyed = true;
              }
            } else if (cell === BLOCK_SPIKE_L) {
              if (x > 0 && isNonWallBlock(nextSpikeGrid[y][x - 1])) {
                nextSpikeGrid[y][x - 1] = BLOCK_EMPTY;
                spikeDestroyed = true;
              }
            } else if (cell === BLOCK_SPIKE_R) {
              if (x < currentGrid[y].length - 1 && isNonWallBlock(nextSpikeGrid[y][x + 1])) {
                nextSpikeGrid[y][x + 1] = BLOCK_EMPTY;
                spikeDestroyed = true;
              }
            }
          }
        }

        if (spikeDestroyed) {
          currentGrid = nextSpikeGrid;
          setGrid(currentGrid);
          if (stateRef.current) stateRef.current.grid = currentGrid;
          updateBlockCounts(currentGrid);
          playEngineSound("break", muted);
          await delay(200);
          if (stateRef.current?.grid) {
            currentGrid = copyGrid(stateRef.current.grid);
          }
          continue; // Re-evaluate gravity and spikes after block removal
        }

        // 2. Match Phase (2 or more adjacent identical blocks touch)
        let matchChanged = false;
        const toClearKeys = new Set<string>();

        const dy = [-1, 1, 0, 0];
        const dx = [0, 0, -1, 1];

        for (let y = 0; y < currentGrid.length; y++) {
          for (let x = 0; x < currentGrid[y].length; x++) {
            const cell = currentGrid[y][x];
            if (isNonWallBlock(cell)) {
              // Check neighbors
              for (let i = 0; i < 4; i++) {
                const ny = y + dy[i];
                const nx = x + dx[i];
                if (
                  ny >= 0 &&
                  ny < currentGrid.length &&
                  nx >= 0 &&
                  nx < currentGrid[0].length
                ) {
                  const neighbor = currentGrid[ny][nx];
                  if (isNonWallBlock(neighbor)) {
                    if (
                      cell === neighbor ||
                      cell === BLOCK_BOMB ||
                      neighbor === BLOCK_BOMB
                    ) {
                      toClearKeys.add(`${y},${x}`);
                      toClearKeys.add(`${ny},${nx}`);
                      matchChanged = true;
                    }
                  }
                }
              }
            }
          }
        }

        if (matchChanged) {
          // Record flashing blocks
          const nextFlashing: Record<string, boolean> = {};
          toClearKeys.forEach((key) => {
            nextFlashing[key] = true;
          });
          setFlashingBlocks(nextFlashing);
          playEngineSound("match", muted);

          await delay(600); // Wait for the flashing animation to complete

          setFlashingBlocks({});
          const baseGrid = stateRef.current?.grid ? stateRef.current.grid : currentGrid;
          const nextMatchGrid = copyGrid(baseGrid);
          toClearKeys.forEach((key) => {
            const [yStr, xStr] = key.split(",");
            const y = parseInt(yStr, 10);
            const x = parseInt(xStr, 10);
            nextMatchGrid[y][x] = BLOCK_EMPTY;
          });
          currentGrid = nextMatchGrid;
          setGrid(currentGrid);
          if (stateRef.current) stateRef.current.grid = currentGrid;
          updateBlockCounts(currentGrid);
          continue; // Loop back to gravity check to drop blocks that were held
        }

        // Neither gravity nor matches occurred, physics is stable
        keepGoing = false;
      }

      // Check win/lose conditions after resolution
      const finalCounts = updateBlockCounts(currentGrid);
      const remainingBlocks = Object.values(finalCounts).reduce(
        (a, b) => a + b,
        0,
      );

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
      if (stateRef.current) stateRef.current.isProcessing = false;
    },
    [isEditorMode, muted, updateBlockCounts, setGrabbed],
  );

  // Move Block left, right, up, or down
  const moveBlock = useCallback(
    (x: number, y: number, dx: number, dy: number) => {
      const curState = stateRef.current;

      if (
        curState.isProcessing ||
        curState.isGameOver ||
        curState.isLevelCleared ||
        curState.isEditorMode
      )
        return;

      const currentGrid = curState.grid;
      const block = currentGrid[y]?.[x];
      if (
        block === undefined ||
        block === BLOCK_EMPTY ||
        block === BLOCK_WALL ||
        block === BLOCK_SPIKE_U ||
        block === BLOCK_SPIKE_D ||
        block === BLOCK_SPIKE_L ||
        block === BLOCK_SPIKE_R
      ) {
        playEngineSound("error", curState.muted);
        return;
      }

      // Check restrictions for moving walls
      if (block === BLOCK_WALL_H && dy !== 0) {
        playEngineSound("error", curState.muted);
        return;
      }
      if (block === BLOCK_WALL_V && dx !== 0) {
        playEngineSound("error", curState.muted);
        return;
      }
      // Standard match blocks can only slide horizontally
      if (block !== BLOCK_WALL_H && block !== BLOCK_WALL_V && dy !== 0) {
        playEngineSound("error", curState.muted);
        return;
      }

      // Collect stack of blocks sitting on top (only if the block is a moving wall)
      const isMovingWall =
        block === BLOCK_WALL_H ||
        block === BLOCK_WALL_V ||
        block === BLOCK_AUTO_WALL_H ||
        block === BLOCK_AUTO_WALL_V;

      const coords: Position[] = [{ x, y }];
      if (isMovingWall) {
        let ky = y - 1;
        while (ky >= 0) {
          const aboveBlock = currentGrid[ky][x];
          if (
            aboveBlock === BLOCK_EMPTY ||
            aboveBlock === BLOCK_WALL ||
            aboveBlock === BLOCK_SPIKE_U ||
            aboveBlock === BLOCK_SPIKE_D ||
            aboveBlock === BLOCK_SPIKE_L ||
            aboveBlock === BLOCK_SPIKE_R
          ) {
            break;
          }
          coords.push({ x, y: ky });
          ky--;
        }
      }

      // Verify all stack components can slide into targets
      const W = currentGrid[0].length;
      const H = currentGrid.length;
      let blocked = false;
      const targetCoords: Position[] = [];

      for (const coord of coords) {
        const tx = coord.x + dx;
        const ty = coord.y + dy;

        if (tx < 0 || tx >= W || ty < 0 || ty >= H) {
          blocked = true;
          break;
        }

        const destCell = currentGrid[ty][tx];
        // Dest cell must be empty OR part of the moving stack itself
        const inStack = coords.some((c) => c.x === tx && c.y === ty);
        if (destCell !== BLOCK_EMPTY && !inStack) {
          blocked = true;
          break;
        }
        targetCoords.push({ x: tx, y: ty });
      }

      if (blocked) {
        playEngineSound("error", curState.muted);
        return;
      }

      // Execute shift
      const nextGrid = copyGrid(currentGrid);
      // First clear old positions
      for (const coord of coords) {
        nextGrid[coord.y][coord.x] = BLOCK_EMPTY;
      }
      // Write to new positions
      for (let i = 0; i < coords.length; i++) {
        const src = coords[i];
        const dest = targetCoords[i];
        nextGrid[dest.y][dest.x] = currentGrid[src.y][src.x];
      }

      // Find new position for the primary cursor cell
      const newCursorX = x + dx;
      const newCursorY = y + dy;

      setHasMovedFirstBlock(true);
      setGrid(nextGrid);
      if (stateRef.current) {
        stateRef.current.grid = nextGrid;
        stateRef.current.hasMovedFirstBlock = true;
        stateRef.current.cursor = { x: newCursorX, y: newCursorY };
      }
      setCursor({ x: newCursorX, y: newCursorY });
      playEngineSound("select", curState.muted);

      // Start physics solver
      runPhysicsLoop(nextGrid, newCursorX, newCursorY);
    },
    [runPhysicsLoop],
  );

  // Level Editor Grid modification methods
  const editorPlaceBlock = useCallback(
    (x: number, y: number, blockType: CellType) => {
      if (!isEditorMode) return;
      if (grid[y]?.[x] === blockType) return;
      const nextGrid = grid.map((row) => [...row]);
      nextGrid[y][x] = blockType;
      setGrid(nextGrid);
      updateBlockCounts(nextGrid);
      playEngineSound("select", muted);
    },
    [grid, isEditorMode, updateBlockCounts, muted],
  );

  const editorClearGrid = useCallback(() => {
    if (!isEditorMode) return;
    setGrabbed(false);
    const newGrid = Array.from({ length: 8 }, () => Array(8).fill(BLOCK_EMPTY));
    setGrid(newGrid);
    setBlockCounts({});
    playEngineSound("error", muted);
  }, [isEditorMode, muted, setBlockCounts, setGrabbed]);

  const editorResizeGrid = useCallback(
    (newRows: number, newCols: number) => {
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
    },
    [isEditorMode, updateBlockCounts],
  );

  const triggerShot = useCallback(
    (
      x: number,
      y: number,
      dirX: number,
      curGrid: CellType[][],
      curMuted: boolean,
    ) => {
      const W = curGrid[0]?.length || 8;
      playEngineSound("shoot", curMuted);

      // Raycast to find target
      let tx = x + dirX;
      while (tx >= 0 && tx < W) {
        const cell = curGrid[y][tx];
        if (cell !== BLOCK_EMPTY) {
          break;
        }
        tx += dirX;
      }

      const bulletId = Math.random().toString();
      const newBullet: Bullet = {
        id: bulletId,
        startX: x,
        startY: y,
        targetX: tx,
        targetY: y,
        dir: dirX,
      };

      setBullets((prev) => [...prev, newBullet]);

      setTimeout(() => {
        setBullets((prev) => prev.filter((b) => b.id !== bulletId));

        setGrid((prevGrid) => {
          const currentW = prevGrid[0]?.length || 8;
          let hitX = x + dirX;
          while (hitX >= 0 && hitX < currentW) {
            if (hitX === tx || prevGrid[y][hitX] !== BLOCK_EMPTY) {
              break;
            }
            hitX += dirX;
          }

          if (hitX >= 0 && hitX < currentW) {
            const currentCell = prevGrid[y][hitX];
            if (isNonWallBlock(currentCell)) {
              const nextGrid = copyGrid(prevGrid);
              nextGrid[y][hitX] = BLOCK_EMPTY;
              if (stateRef.current) {
                stateRef.current.grid = nextGrid;
              }
              playEngineSound("break", curMuted);
              if (!stateRef.current?.isProcessing) {
                runPhysicsLoop(nextGrid);
              }
              return nextGrid;
            }
          }
          return prevGrid;
        });
      }, 300);
    },
    [runPhysicsLoop],
  );

  useEffect(() => {
    triggerShotRef.current = triggerShot;
  }, [triggerShot]);

  // Interval timer for auto-moving walls (patrol slabs)
  useEffect(() => {
    if (isEditorMode || !hasMovedFirstBlock) return;

    const interval = setInterval(() => {
      const {
        grid: curGrid,
        cursor: curCursor,
        isProcessing: curProcessing,
        isGameOver: curGameOver,
        isLevelCleared: curLevelCleared,
      } = stateRef.current;

      // Skip this tick if the game is over, cleared, or currently resolving physics
      if (curGameOver || curLevelCleared || curProcessing) return;

      let moved = false;
      const nextGrid = copyGrid(curGrid);
      const H = nextGrid.length;
      const W = nextGrid[0]?.length || 0;

      // Track which cells have already been processed in this tick to avoid double moves
      const processed = Array.from({ length: H }, () => Array(W).fill(false));
      const nextDirections: Record<string, number> = {
        ...autoWallDirections.current,
      };

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (processed[y][x]) continue;

          const cell = curGrid[y][x];
          if (cell === BLOCK_AUTO_WALL_H) {
            const dirKey = `${y},${x}`;
            let dx =
              nextDirections[dirKey] !== undefined
                ? nextDirections[dirKey]
                : -1;

            // Collect stack above this auto-wall
            const stack: Position[] = [{ x, y }];
            let ky = y - 1;
            while (ky >= 0) {
              const above = nextGrid[ky][x];
              if (
                above === BLOCK_EMPTY ||
                above === BLOCK_WALL ||
                above === BLOCK_SPIKE_U ||
                above === BLOCK_SPIKE_D ||
                above === BLOCK_SPIKE_L ||
                above === BLOCK_SPIKE_R
              )
                break;
              stack.push({ x, y: ky });
              ky--;
            }

            // Check if stack can move horizontally
            let canMove = true;
            for (const item of stack) {
              const nx = item.x + dx;
              const ny = item.y;
              if (nx < 0 || nx >= W) {
                canMove = false;
                break;
              }
              const destCell = nextGrid[ny][nx];
              const isSelf = stack.some((s) => s.x === nx && s.y === ny);
              if (destCell !== BLOCK_EMPTY && !isSelf) {
                canMove = false;
                break;
              }
            }

            if (!canMove) {
              // Reverse direction and try again
              dx = -dx;
              canMove = true;
              for (const item of stack) {
                const nx = item.x + dx;
                const ny = item.y;
                if (nx < 0 || nx >= W) {
                  canMove = false;
                  break;
                }
                const destCell = nextGrid[ny][nx];
                const isSelf = stack.some((s) => s.x === nx && s.y === ny);
                if (destCell !== BLOCK_EMPTY && !isSelf) {
                  canMove = false;
                  break;
                }
              }
            }

            if (canMove) {
              // Execute stack shift
              const originalValues = stack.map(
                (item) => nextGrid[item.y][item.x],
              );
              // Clear old
              for (const item of stack) {
                nextGrid[item.y][item.x] = BLOCK_EMPTY;
              }
              // Write new
              for (let i = 0; i < stack.length; i++) {
                const item = stack[i];
                nextGrid[item.y][item.x + dx] = originalValues[i];
                processed[item.y][item.x + dx] = true;
              }

              // Adjust cursor selector if it was on a block in this stack
              let cursorIndex = -1;
              for (let i = 0; i < stack.length; i++) {
                if (stack[i].x === curCursor.x && stack[i].y === curCursor.y) {
                  cursorIndex = i;
                  break;
                }
              }
              if (cursorIndex !== -1) {
                setCursor((prev) => ({ x: prev.x + dx, y: prev.y }));
              }

              delete nextDirections[dirKey];
              nextDirections[`${y},${x + dx}`] = dx;
              moved = true;
            } else {
              nextDirections[dirKey] = dx;
            }
          } else if (cell === BLOCK_AUTO_WALL_V) {
            const dirKey = `${y},${x}`;
            let dy =
              nextDirections[dirKey] !== undefined
                ? nextDirections[dirKey]
                : -1;

            // Collect stack above this auto-wall
            const stack: Position[] = [{ x, y }];
            let ky = y - 1;
            while (ky >= 0) {
              const above = nextGrid[ky][x];
              if (
                above === BLOCK_EMPTY ||
                above === BLOCK_WALL ||
                above === BLOCK_SPIKE_U ||
                above === BLOCK_SPIKE_D ||
                above === BLOCK_SPIKE_L ||
                above === BLOCK_SPIKE_R
              )
                break;
              stack.push({ x, y: ky });
              ky--;
            }

            // Check if stack can move vertically
            let canMove = true;
            for (const item of stack) {
              const nx = item.x;
              const ny = item.y + dy;
              if (ny < 0 || ny >= H) {
                canMove = false;
                break;
              }
              const destCell = nextGrid[ny][nx];
              const isSelf = stack.some((s) => s.x === nx && s.y === ny);
              if (destCell !== BLOCK_EMPTY && !isSelf) {
                canMove = false;
                break;
              }
            }

            if (!canMove) {
              // Reverse direction and try again
              dy = -dy;
              canMove = true;
              for (const item of stack) {
                const nx = item.x;
                const ny = item.y + dy;
                if (ny < 0 || ny >= H) {
                  canMove = false;
                  break;
                }
                const destCell = nextGrid[ny][nx];
                const isSelf = stack.some((s) => s.x === nx && s.y === ny);
                if (destCell !== BLOCK_EMPTY && !isSelf) {
                  canMove = false;
                  break;
                }
              }
            }

            if (canMove) {
              // Execute stack shift
              const originalValues = stack.map(
                (item) => nextGrid[item.y][item.x],
              );
              // Clear old
              for (const item of stack) {
                nextGrid[item.y][item.x] = BLOCK_EMPTY;
              }
              // Write new
              for (let i = 0; i < stack.length; i++) {
                const item = stack[i];
                nextGrid[item.y + dy][item.x] = originalValues[i];
                processed[item.y + dy][item.x] = true;
              }

              // Adjust cursor selector if it was on a block in this stack
              let cursorIndex = -1;
              for (let i = 0; i < stack.length; i++) {
                if (stack[i].x === curCursor.x && stack[i].y === curCursor.y) {
                  cursorIndex = i;
                  break;
                }
              }
              if (cursorIndex !== -1) {
                setCursor((prev) => ({ x: prev.x, y: prev.y + dy }));
              }

              delete nextDirections[dirKey];
              nextDirections[`${y + dy},${x}`] = dy;
              moved = true;
            } else {
              nextDirections[dirKey] = dy;
            }
          }
        }
      }

      if (moved) {
        autoWallDirections.current = nextDirections;
        setGrid(nextGrid);
        runPhysicsLoop(nextGrid);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isEditorMode, hasMovedFirstBlock, runPhysicsLoop, setCursor]);

  // Interval timer for shooter blocks
  useEffect(() => {
    if (isEditorMode || !hasMovedFirstBlock) return;

    const interval = setInterval(() => {
      const {
        grid: curGrid,
        isProcessing: curProcessing,
        isGameOver: curGameOver,
        isLevelCleared: curLevelCleared,
        muted: curMuted,
        triggerShot: curTriggerShot,
      } = stateRef.current;

      // Skip this tick if the game is over, cleared, or currently resolving physics
      if (curGameOver || curLevelCleared || curProcessing) return;

      // Scan grid for shooters and trigger shooting if button is pressed
      const H = curGrid.length;
      const W = curGrid[0]?.length || 0;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const cell = curGrid[y][x];
          const isShooter =
            cell === BLOCK_SHOOTER_L ||
            cell === BLOCK_SHOOTER_R ||
            cell === BLOCK_SHOOTER_L_ONCE ||
            cell === BLOCK_SHOOTER_R_ONCE;

          if (!isShooter) continue;

          const key = `${y},${x}`;
          const hasBlockOnTop = y > 0 && curGrid[y - 1][x] !== BLOCK_EMPTY;

          if (hasBlockOnTop) {
            if (cell === BLOCK_SHOOTER_L || cell === BLOCK_SHOOTER_R) {
              const lastFired = cooldownsRef.current[key] || 0;
              if (Date.now() - lastFired >= SHOOTER_INTERVAL) {
                const dirX = cell === BLOCK_SHOOTER_L ? -1 : 1;
                curTriggerShot(x, y, dirX, curGrid, curMuted);
                cooldownsRef.current[key] = Date.now();
              }
            } else {
              const fired = firedOnceRef.current[key] || false;
              if (!fired) {
                const dirX = cell === BLOCK_SHOOTER_L_ONCE ? -1 : 1;
                curTriggerShot(x, y, dirX, curGrid, curMuted);
                firedOnceRef.current[key] = true;
              }
            }
          } else {
            // Reset state when block is removed/empty
            firedOnceRef.current[key] = false;
            cooldownsRef.current[key] = 0;
          }
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isEditorMode, hasMovedFirstBlock]);

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
    hasMovedFirstBlock,
    flashingBlocks,
    bullets,
  };
};
