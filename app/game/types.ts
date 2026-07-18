declare const require: (path: string) => unknown;

import {
  BlockId,
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

// ── Raw JSON shape ──
interface RawLevelData {
  name: string;
  grid: number[][];
  timeLimit?: number;
}

// ── Public types ──
export type CellType = BlockId;

export interface Position {
  x: number;
  y: number;
}

export interface LevelData {
  name: string;
  grid: CellType[][];
  timeLimit: number;
}

export interface Bullet {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  dir: number;
  ignoreNextCell?: boolean;
  firedAt?: number;
}

// ── Constants ──
// Configurable turn delay in ticks (each tick is 450ms) for auto-moving walls
// Set to 0 for no delay, 1 for 450ms delay, 2 for 900ms delay, etc.
export const AUTO_WALL_TURN_DELAY_TICKS = 2;

export const SHOOTER_INTERVAL = 1000;

// ── Level data ──
const realMap: RawLevelData[] = typeof window !== "undefined"
  ? (!window.location.pathname.includes("/editor") || process.env.NEXT_PUBLIC_APP_ENV === "LOCAL"
      ? (require("../level/real-map.json") as RawLevelData[])
      : [])
  : (require("../level/real-map.json") as RawLevelData[]);

export { realMap };

export const BUILTIN_LEVELS: LevelData[] = realMap as LevelData[];

// ── Utility functions ──
export const copyGrid = (src: CellType[][]): CellType[][] => {
  return src.map((row) => [...row]);
};

export const isNonWallBlock = (id: BlockId): boolean => {
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

export const findInitialCursor = (grid: CellType[][]): Position => {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isNonWallBlock(grid[y][x])) {
        return { x, y };
      }
    }
  }
  return { x: Math.floor(w / 2), y: h - 1 };
};
