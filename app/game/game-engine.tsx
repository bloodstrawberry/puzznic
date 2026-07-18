"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import {
  BLOCK_EMPTY,
  BLOCK_WALL,
  BLOCK_WALL_V,
  BLOCK_WALL_H,
  BLOCK_AUTO_WALL_V,
  BLOCK_AUTO_WALL_H,
  BLOCK_SHOOTER_L,
  BLOCK_SHOOTER_R,
  BLOCK_SHOOTER_L_ONCE,
  BLOCK_SHOOTER_R_ONCE,
  BLOCK_SPIKE_U,
  BLOCK_SPIKE_D,
  BLOCK_SPIKE_L,
  BLOCK_SPIKE_R,
} from "../object/constants";

// ── Re-export public types & constants from modules ──
export type { CellType, Position, LevelData, Bullet } from "./types";
export { BUILTIN_LEVELS, AUTO_WALL_TURN_DELAY_TICKS, SHOOTER_INTERVAL } from "./types";

import {
  type CellType,
  type Position,
  type Bullet,
  BUILTIN_LEVELS,
  AUTO_WALL_TURN_DELAY_TICKS,
  SHOOTER_INTERVAL,
  realMap,
  copyGrid,
  isNonWallBlock,
  findInitialCursor,
} from "./types";
import { playEngineSound } from "./sound";
import {
  applyGravity,
  applySpikes,
  findMatches,
  clearMatches,
  tryMoveBlock,
} from "./physics";
import { useEditorEngine } from "./editor-logic";

export const useGameEngine = (
  initialLevelIndex = 0,
  isEditorMode = false,
  isEditorPage = false,
) => {
  const [levelIndex, setLevelIndex] = useState<number>(initialLevelIndex);
  const autoWallDirections = useRef<Record<string, number>>({});
  const autoWallDelays = useRef<Record<string, number>>({});
  const physicsLoopIdRef = useRef<number>(0);
  const prevGridRef = useRef<CellType[][]>([]);

  const [grid, setGrid] = useState<CellType[][]>(() => {
    if (isEditorMode) {
      const firstLvl = realMap[0];
      return firstLvl
        ? copyGrid(firstLvl.grid as CellType[][])
        : Array.from({ length: 8 }, () => Array(8).fill(BLOCK_EMPTY));
    }
    return copyGrid(BUILTIN_LEVELS[initialLevelIndex].grid);
  });
  const [cursor, setCursor] = useState<Position>(() => {
    if (isEditorMode) {
      const firstLvl = realMap[0];
      const w = firstLvl?.grid[0]?.length ?? 8;
      const h = firstLvl?.grid?.length ?? 8;
      return { x: Math.floor(w / 2), y: h - 1 };
    }
    return findInitialCursor(BUILTIN_LEVELS[initialLevelIndex].grid);
  });
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (isEditorMode) {
      const firstLvl = realMap[0];
      return firstLvl ? (firstLvl.timeLimit ?? 180) : 180;
    }
    return BUILTIN_LEVELS[initialLevelIndex].timeLimit;
  });

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
    grabbed: boolean;
    isProcessing: boolean;
    isGameOver: boolean;
    isLevelCleared: boolean;
    hasMovedFirstBlock: boolean;
    isEditorMode: boolean;
    muted: boolean;
    flashingBlocks: Record<string, boolean>;
    bullets: Bullet[];
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
    grabbed: false,
    isProcessing: false,
    isGameOver: false,
    isLevelCleared: false,
    hasMovedFirstBlock: false,
    isEditorMode: false,
    muted: false,
    flashingBlocks: {},
    bullets: [],
    triggerShot: (x, y, dirX, curGrid, curMuted) =>
      triggerShotRef.current(x, y, dirX, curGrid, curMuted),
  });

  useEffect(() => {
    stateRef.current = {
      grid,
      cursor,
      grabbed,
      isProcessing,
      isGameOver,
      isLevelCleared,
      hasMovedFirstBlock,
      isEditorMode,
      muted,
      flashingBlocks,
      bullets,
      triggerShot: (x, y, dirX, curGrid, curMuted) =>
        triggerShotRef.current(x, y, dirX, curGrid, curMuted),
    };
  }, [
    grid,
    cursor,
    grabbed,
    isProcessing,
    isGameOver,
    isLevelCleared,
    hasMovedFirstBlock,
    isEditorMode,
    muted,
    flashingBlocks,
    bullets,
  ]);

  const updateCursor = useCallback(
    (updater: Position | ((prev: Position) => Position)) => {
      if (typeof updater === "function") {
        setCursor((prev) => {
          const next = updater(prev);
          if (stateRef.current) {
            stateRef.current.cursor = next;
          }
          return next;
        });
      } else {
        if (stateRef.current) {
          stateRef.current.cursor = updater;
        }
        setCursor(updater);
      }
    },
    [setCursor],
  );

  const updateGrabbed = useCallback(
    (updater: boolean | ((prev: boolean) => boolean)) => {
      if (typeof updater === "function") {
        setGrabbed((prev) => {
          const next = updater(prev);
          if (stateRef.current) {
            stateRef.current.grabbed = next;
          }
          return next;
        });
      } else {
        if (stateRef.current) {
          stateRef.current.grabbed = updater;
        }
        setGrabbed(updater);
      }
    },
    [setGrabbed],
  );

  const checkAndReleaseGrabbed = useCallback(
    (targetGrid: CellType[][], customFlashing?: Record<string, boolean>) => {
      if (!stateRef.current) return;
      const { cursor: curPos, grabbed: curLock, flashingBlocks: stateFlashing } = stateRef.current;
      if (!curLock) return;
      const cell = targetGrid[curPos.y]?.[curPos.x];
      const curFlashing = customFlashing || stateFlashing || {};
      const isGrabable =
        cell !== undefined &&
        cell !== BLOCK_EMPTY &&
        cell !== BLOCK_WALL &&
        cell !== BLOCK_AUTO_WALL_V &&
        cell !== BLOCK_AUTO_WALL_H &&
        cell !== BLOCK_SPIKE_U &&
        cell !== BLOCK_SPIKE_D &&
        cell !== BLOCK_SPIKE_L &&
        cell !== BLOCK_SPIKE_R;

      if (!isGrabable || curFlashing[`${curPos.y},${curPos.x}`]) {
        updateGrabbed(false);
      }
    },
    [updateGrabbed],
  );

  const [blockCounts, setBlockCounts] = useState<Record<string, number>>(() => {
    const initialGrid = isEditorMode
      ? (realMap[0]?.grid as CellType[][]) || Array.from({ length: 8 }, () => Array(8).fill(BLOCK_EMPTY))
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

  // ── Editor engine (delegated) ──
  const editor = useEditorEngine(
    isEditorMode,
    grid,
    setGrid,
    setCursor,
    setTimeLeft,
    muted,
    updateBlockCounts,
    setBlockCounts,
    setGrabbed,
    setIsGameOver,
    setIsLevelCleared,
    setIsProcessing,
    setBullets,
    setFlashingBlocks,
    stateRef as React.MutableRefObject<{ flashingBlocks: Record<string, boolean> }>,
    setHasMovedFirstBlock,
    updateGrabbed,
  );

  // Initialize and Reset levels
  const loadLevel = useCallback(
    (levelIdx: number) => {
      if (levelIdx < 0 || levelIdx >= BUILTIN_LEVELS.length) return;
      physicsLoopIdRef.current++;
      const level = BUILTIN_LEVELS[levelIdx];
      setLevelIndex(levelIdx);
      setGrid(copyGrid(level.grid));
      setTimeLeft(level.timeLimit);
      setIsGameOver(false);
      setIsLevelCleared(false);
      setIsProcessing(false);
      updateCursor(findInitialCursor(level.grid));
      updateGrabbed(false);
      setFlashingBlocks({});
      if (stateRef.current) stateRef.current.flashingBlocks = {};
      setBullets([]);
      firedOnceRef.current = {};
      cooldownsRef.current = {};
      autoWallDirections.current = {};
      autoWallDelays.current = {};
      prevGridRef.current = [];
      setHasMovedFirstBlock(false);
      updateBlockCounts(level.grid);
      playEngineSound("start", muted);
    },
    [muted, updateBlockCounts, updateGrabbed, updateCursor],
  );

  const resetLevel = useCallback(() => {
    physicsLoopIdRef.current++;
    updateGrabbed(false);
    setFlashingBlocks({});
    if (stateRef.current) stateRef.current.flashingBlocks = {};
    setBullets([]);
    firedOnceRef.current = {};
    cooldownsRef.current = {};
    autoWallDirections.current = {};
    autoWallDelays.current = {};
    setHasMovedFirstBlock(false);
    prevGridRef.current = [];
    if (isEditorPage) {
      const activeLvl = editor.editorLevels[editor.editorActiveIndex];
      if (activeLvl) {
        setGrid(copyGrid(activeLvl.grid));
        updateBlockCounts(activeLvl.grid);
        setTimeLeft(activeLvl.timeLimit);
      }
      setIsLevelCleared(false);
      setIsGameOver(false);
      setIsProcessing(false);
    } else {
      loadLevel(levelIndex);
    }
  }, [
    isEditorPage,
    editor.editorActiveIndex,
    editor.editorLevels,
    levelIndex,
    loadLevel,
    updateBlockCounts,
    updateGrabbed,
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
    async (startGrid: CellType[][]) => {
      const currentLoopId = ++physicsLoopIdRef.current;
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
        const gravityResult = applyGravity(currentGrid);

        if (gravityResult.changed) {
          if (stateRef.current?.grabbed) {
            const { cursor: curCursor } = stateRef.current;
            const oldCell = currentGrid[curCursor.y]?.[curCursor.x];
            const newCell = gravityResult.grid[curCursor.y + 1]?.[curCursor.x];
            const oldCellNowEmpty = gravityResult.grid[curCursor.y]?.[curCursor.x] === BLOCK_EMPTY;
            if (isNonWallBlock(oldCell) && newCell === oldCell && oldCellNowEmpty) {
              const nextCursor = { x: curCursor.x, y: curCursor.y + 1 };
              updateCursor(nextCursor);
            }
          }
          currentGrid = gravityResult.grid;
          setGrid(currentGrid);
          if (stateRef.current) stateRef.current.grid = currentGrid;
          checkAndReleaseGrabbed(currentGrid);
          updateBlockCounts(currentGrid);
          playEngineSound("fall", muted);
          await delay(200); // falling animation duration
          if (physicsLoopIdRef.current !== currentLoopId) return;
          if (stateRef.current?.grid) {
            currentGrid = copyGrid(stateRef.current.grid);
          }
          continue; // Re-evaluate gravity until stable
        }

        // 1.5 Spike check phase
        const spikeResult = applySpikes(currentGrid);

        if (spikeResult.changed) {
          currentGrid = spikeResult.grid;
          setGrid(currentGrid);
          if (stateRef.current) stateRef.current.grid = currentGrid;
          checkAndReleaseGrabbed(currentGrid);
          updateBlockCounts(currentGrid);
          playEngineSound("break", muted);
          await delay(200);
          if (physicsLoopIdRef.current !== currentLoopId) return;
          if (stateRef.current?.grid) {
            currentGrid = copyGrid(stateRef.current.grid);
          }
          continue; // Re-evaluate gravity and spikes after block removal
        }

        // 2. Match Phase (2 or more adjacent identical blocks touch)
        const matchResult = findMatches(currentGrid);

        if (matchResult.changed) {
          // Record flashing blocks
          const nextFlashing: Record<string, boolean> = {};
          matchResult.toClearKeys.forEach((key) => {
            nextFlashing[key] = true;
          });
          setFlashingBlocks(nextFlashing);
          if (stateRef.current) stateRef.current.flashingBlocks = nextFlashing;
          checkAndReleaseGrabbed(currentGrid, nextFlashing);
          playEngineSound("match", muted);

          await delay(600); // Wait for the flashing animation to complete
          if (physicsLoopIdRef.current !== currentLoopId) return;

          setFlashingBlocks({});
          if (stateRef.current) stateRef.current.flashingBlocks = {};
          const baseGrid = stateRef.current?.grid ? stateRef.current.grid : currentGrid;
          currentGrid = clearMatches(baseGrid, matchResult.toClearKeys);
          setGrid(currentGrid);
          if (stateRef.current) stateRef.current.grid = currentGrid;
          checkAndReleaseGrabbed(currentGrid);
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
      checkAndReleaseGrabbed(currentGrid);

      setIsProcessing(false);
      if (stateRef.current) stateRef.current.isProcessing = false;
    },
    [isEditorMode, muted, updateBlockCounts, checkAndReleaseGrabbed, updateCursor],
  );

  // Move Block left, right, up, or down
  const moveBlock = useCallback(
    (x: number, y: number, dx: number, dy: number) => {
      const curState = stateRef.current;

      if (
        curState.isGameOver ||
        curState.isLevelCleared ||
        curState.isEditorMode ||
        curState.isProcessing ||
        curState.flashingBlocks[`${y},${x}`]
      )
        return;

      const result = tryMoveBlock(
        curState.grid,
        x,
        y,
        dx,
        dy,
        curState.flashingBlocks,
      );

      if (!result.success) {
        playEngineSound("error", curState.muted);
        return;
      }

      setHasMovedFirstBlock(true);
      setGrid(result.grid);
      if (stateRef.current) {
        stateRef.current.grid = result.grid;
        stateRef.current.hasMovedFirstBlock = true;
        stateRef.current.cursor = { x: result.newCursorX, y: result.newCursorY };
      }
      updateCursor({ x: result.newCursorX, y: result.newCursorY });
      playEngineSound("select", curState.muted);

      // Start physics solver only if not already running
      if (!curState.isProcessing) {
        runPhysicsLoop(result.grid);
      }
    },
    [runPhysicsLoop, updateCursor],
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
        firedAt: Date.now(),
      };

      setBullets((prev) => [...prev, newBullet]);

      setTimeout(() => {
        // Read the latest state of this bullet to check if ignoreNextCell is true
        const latestBullet = stateRef.current?.bullets.find((b) => b.id === bulletId);
        const shouldIgnoreNextCell = latestBullet?.ignoreNextCell || false;

        setBullets((prev) => prev.filter((b) => b.id !== bulletId));

        setGrid((prevGrid) => {
          const currentW = prevGrid[0]?.length || 8;
          let hitX = x + dirX;
          while (hitX >= 0 && hitX < currentW) {
            const isNextCell = hitX === x + dirX;
            const shouldIgnore = isNextCell && shouldIgnoreNextCell;

            if (hitX === tx || (prevGrid[y][hitX] !== BLOCK_EMPTY && !shouldIgnore)) {
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
              checkAndReleaseGrabbed(nextGrid);
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
    [runPhysicsLoop, checkAndReleaseGrabbed],
  );

  useEffect(() => {
    triggerShotRef.current = triggerShot;
  }, [triggerShot]);

  // Interval timer for auto-moving walls (patrol slabs)
  useEffect(() => {
    if (isEditorMode) return;

    const interval = setInterval(() => {
      const {
        grid: curGrid,
        cursor: curCursor,
        isProcessing: curProcessing,
        isGameOver: curGameOver,
        isLevelCleared: curLevelCleared,
        flashingBlocks: curFlashingBlocks = {},
      } = stateRef.current;

      // Skip this tick if the game is over or cleared
      if (curGameOver || curLevelCleared) return;

      let moved = false;
      let nextCursor = { ...curCursor };
      const nextGrid = copyGrid(curGrid);
      const H = nextGrid.length;
      const W = nextGrid[0]?.length || 0;

      // Track which cells have already been processed in this tick to avoid double moves
      const processed = Array.from({ length: H }, () => Array(W).fill(false));
      const nextDirections: Record<string, number> = {
        ...autoWallDirections.current,
      };
      const nextDelays: Record<string, number> = {};

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
            const hasDelayKey = autoWallDelays.current[dirKey] !== undefined;
            const currentDelay = hasDelayKey ? autoWallDelays.current[dirKey] : 0;

            // Collect stack above this auto-wall
            const stack: Position[] = [{ x, y }];
            let ky = y - 1;
            while (ky >= 0) {
              const above = nextGrid[ky][x];
              if (
                above === BLOCK_EMPTY ||
                above === BLOCK_WALL ||
                above === BLOCK_WALL_V ||
                above === BLOCK_WALL_H ||
                above === BLOCK_SPIKE_U ||
                above === BLOCK_SPIKE_D ||
                above === BLOCK_SPIKE_L ||
                above === BLOCK_SPIKE_R
              )
                break;
              stack.push({ x, y: ky });
              ky--;
            }

            const hasFlashing = stack.some((item) => curFlashingBlocks[`${item.y},${item.x}`]);
            if (hasFlashing) {
              if (hasDelayKey) {
                nextDelays[dirKey] = currentDelay;
              }
              continue;
            }

            // Check how many items in the stack can move in direction dx
            let moveCount = 0;
            const w0 = stack[0];
            const nx0 = w0.x + dx;
            if (nx0 >= 0 && nx0 < W && nextGrid[w0.y][nx0] === BLOCK_EMPTY) {
              moveCount = 1;
              for (let i = 1; i < stack.length; i++) {
                const item = stack[i];
                const nx = item.x + dx;
                const ny = item.y;
                if (nx >= 0 && nx < W) {
                  const destCell = nextGrid[ny][nx];
                  if (destCell === BLOCK_EMPTY) {
                    moveCount++;
                  } else {
                    break;
                  }
                } else {
                  break;
                }
              }
            }

            if (moveCount === 0) {
              if (!hasDelayKey && AUTO_WALL_TURN_DELAY_TICKS > 0) {
                // Start delay
                nextDelays[dirKey] = AUTO_WALL_TURN_DELAY_TICKS - 1;
                nextDirections[dirKey] = dx;
              } else if (hasDelayKey && currentDelay > 0) {
                // Decrement delay
                nextDelays[dirKey] = currentDelay - 1;
                nextDirections[dirKey] = dx;
              } else {
                // Reverse direction and try again
                dx = -dx;
                const rnx0 = w0.x + dx;
                if (rnx0 >= 0 && rnx0 < W && nextGrid[w0.y][rnx0] === BLOCK_EMPTY) {
                  moveCount = 1;
                  for (let i = 1; i < stack.length; i++) {
                    const item = stack[i];
                    const nx = item.x + dx;
                    const ny = item.y;
                    if (nx >= 0 && nx < W) {
                      const destCell = nextGrid[ny][nx];
                      if (destCell === BLOCK_EMPTY) {
                        moveCount++;
                      } else {
                        break;
                      }
                    } else {
                      break;
                    }
                  }
                }
              }
            }

            if (moveCount > 0) {
              // Execute stack shift for only the movable part
              const movingStack = stack.slice(0, moveCount);
              const originalValues = movingStack.map(
                (item) => nextGrid[item.y][item.x],
              );
              // Clear old
              for (const item of movingStack) {
                nextGrid[item.y][item.x] = BLOCK_EMPTY;
              }
              // Write new
              for (let i = 0; i < movingStack.length; i++) {
                const item = movingStack[i];
                nextGrid[item.y][item.x + dx] = originalValues[i];
                processed[item.y][item.x + dx] = true;
              }

              // Adjust cursor selector if it was on a block in this stack
              let cursorIndex = -1;
              for (let i = 0; i < movingStack.length; i++) {
                if (movingStack[i].x === nextCursor.x && movingStack[i].y === nextCursor.y) {
                  cursorIndex = i;
                  break;
                }
              }
              if (cursorIndex !== -1) {
                nextCursor = { x: nextCursor.x + dx, y: nextCursor.y };
                if (stateRef.current) {
                  stateRef.current.cursor = nextCursor;
                }
                updateCursor(nextCursor);
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
            const hasDelayKey = autoWallDelays.current[dirKey] !== undefined;
            const currentDelay = hasDelayKey ? autoWallDelays.current[dirKey] : 0;

            // Collect stack above this auto-wall
            const stack: Position[] = [{ x, y }];
            let ky = y - 1;
            while (ky >= 0) {
              const above = nextGrid[ky][x];
              if (
                above === BLOCK_EMPTY ||
                above === BLOCK_WALL ||
                above === BLOCK_WALL_V ||
                above === BLOCK_WALL_H ||
                above === BLOCK_SPIKE_U ||
                above === BLOCK_SPIKE_D ||
                above === BLOCK_SPIKE_L ||
                above === BLOCK_SPIKE_R
              )
                break;
              stack.push({ x, y: ky });
              ky--;
            }

            const hasFlashing = stack.some((item) => curFlashingBlocks[`${item.y},${item.x}`]);
            if (hasFlashing) {
              if (hasDelayKey) {
                nextDelays[dirKey] = currentDelay;
              }
              continue;
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
              if (!hasDelayKey && AUTO_WALL_TURN_DELAY_TICKS > 0) {
                // Start delay
                nextDelays[dirKey] = AUTO_WALL_TURN_DELAY_TICKS - 1;
                nextDirections[dirKey] = dy;
              } else if (hasDelayKey && currentDelay > 0) {
                // Decrement delay
                nextDelays[dirKey] = currentDelay - 1;
                nextDirections[dirKey] = dy;
              } else {
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
                if (stack[i].x === nextCursor.x && stack[i].y === nextCursor.y) {
                  cursorIndex = i;
                  break;
                }
              }
              if (cursorIndex !== -1) {
                nextCursor = { x: nextCursor.x, y: nextCursor.y + dy };
                if (stateRef.current) {
                  stateRef.current.cursor = nextCursor;
                }
                updateCursor(nextCursor);
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

      autoWallDirections.current = nextDirections;
      autoWallDelays.current = nextDelays;

      if (moved) {
        if (stateRef.current) {
          stateRef.current.grid = nextGrid;
          stateRef.current.cursor = nextCursor;
        }
        setGrid(nextGrid);
        checkAndReleaseGrabbed(nextGrid);
        if (!curProcessing) {
          runPhysicsLoop(nextGrid);
        }
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isEditorMode, runPhysicsLoop, updateCursor, checkAndReleaseGrabbed]);

  // Watch grid changes to detect when a block leaves a shooter
  useEffect(() => {
    if (isEditorMode) return;
    const prevGrid = prevGridRef.current;
    if (
      prevGrid.length === 0 ||
      prevGrid.length !== grid.length ||
      (grid.length > 0 && prevGrid[0]?.length !== grid[0]?.length)
    ) {
      prevGridRef.current = copyGrid(grid);
      return;
    }

    const H = grid.length;
    const W = grid[0]?.length || 0;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const cell = grid[y][x];
        const isShooter =
          cell === BLOCK_SHOOTER_L ||
          cell === BLOCK_SHOOTER_R ||
          cell === BLOCK_SHOOTER_L_ONCE ||
          cell === BLOCK_SHOOTER_R_ONCE;

        if (isShooter && y > 0) {
          const wasOccupied = prevGrid[y - 1]?.[x] !== BLOCK_EMPTY;
          const isOccupied = grid[y - 1]?.[x] !== BLOCK_EMPTY;
          if (wasOccupied && !isOccupied) {
            // Block was on top of the shooter but has now left
            setBullets((prev) =>
              prev.map((b) =>
                b.startX === x && b.startY === y
                  ? { ...b, ignoreNextCell: true }
                  : b
              )
            );
          }
        }
      }
    }
    prevGridRef.current = copyGrid(grid);
  }, [grid, isEditorMode]);

  // Interval timer for shooter blocks
  useEffect(() => {
    if (isEditorMode) return;

    const interval = setInterval(() => {
      const {
        grid: curGrid,
        isGameOver: curGameOver,
        isLevelCleared: curLevelCleared,
        muted: curMuted,
        triggerShot: curTriggerShot,
      } = stateRef.current;

      // Skip this tick if the game is over or cleared
      if (curGameOver || curLevelCleared) return;

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
  }, [isEditorMode]);

  return {
    grid,
    setGrid,
    cursor,
    setCursor,
    timeLeft,
    setTimeLeft,
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
    editorPlaceBlock: editor.editorPlaceBlock,
    editorClearGrid: editor.editorClearGrid,
    editorResizeGrid: editor.editorResizeGrid,
    editorFillBorder: editor.editorFillBorder,
    editorDeleteRow: editor.editorDeleteRow,
    editorDeleteCol: editor.editorDeleteCol,
    editorFlipHorizontal: editor.editorFlipHorizontal,
    muted,
    setMuted,
    grabbed,
    setGrabbed: updateGrabbed,
    hasMovedFirstBlock,
    flashingBlocks,
    bullets,
    editorLevels: editor.editorLevels,
    setEditorLevels: editor.setEditorLevels,
    editorActiveIndex: editor.editorActiveIndex,
    setEditorActiveIndex: editor.setEditorActiveIndex,
    selectEditorLevel: editor.selectEditorLevel,
    editorAddLevel: editor.editorAddLevel,
    editorDeleteLevel: editor.editorDeleteLevel,
    editorUpdateTimeLimit: editor.editorUpdateTimeLimit,
    editorImportJSON: editor.editorImportJSON,
    editorRestoreLevel: editor.editorRestoreLevel,
    editorUndo: editor.editorUndo,
    editorPushHistory: editor.editorPushHistory,
  };
};
