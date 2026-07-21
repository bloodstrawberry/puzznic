import {
  BLOCK_EMPTY,
  BLOCK_WALL_V,
  BLOCK_WALL_H,
  BLOCK_AUTO_WALL_V,
  BLOCK_AUTO_WALL_H,
  BLOCK_BOMB,
  BLOCK_SPIKE_U,
  BLOCK_SPIKE_D,
  BLOCK_SPIKE_L,
  BLOCK_SPIKE_R,
  getBlockProperties,
} from "../object/constants";

import { CellType, Position, copyGrid } from "./types";

// ── Physics step results ──

export interface GravityResult {
  changed: boolean;
  grid: CellType[][];
}

export interface SpikeResult {
  changed: boolean;
  grid: CellType[][];
}

export interface MatchResult {
  changed: boolean;
  grid: CellType[][];
  toClearKeys: Set<string>;
}

export interface MoveBlockResult {
  success: boolean;
  grid: CellType[][];
  newCursorX: number;
  newCursorY: number;
}

// ── Pure physics step functions ──

/** Apply one pass of gravity (blocks fall one cell down). */
export const applyGravity = (grid: CellType[][]): GravityResult => {
  let changed = false;
  const nextGrid = copyGrid(grid);

  // Process from bottom to top so multiple blocks can drop simultaneously
  for (let y = grid.length - 2; y >= 0; y--) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = nextGrid[y][x];
      if (getBlockProperties(cell, nextGrid)?.canFall) {
        if (nextGrid[y + 1][x] === BLOCK_EMPTY) {
          nextGrid[y + 1][x] = cell;
          nextGrid[y][x] = BLOCK_EMPTY;
          changed = true;
        }
      }
    }
  }

  return { changed, grid: nextGrid };
};

/** Check for spike blocks destroying adjacent non-wall blocks. */
export const applySpikes = (grid: CellType[][]): SpikeResult => {
  let changed = false;
  const nextGrid = copyGrid(grid);

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      if (cell === BLOCK_SPIKE_U) {
        if (
          y > 0 &&
          getBlockProperties(nextGrid[y - 1][x], nextGrid)
            ?.canBeDestroyedByShooter
        ) {
          nextGrid[y - 1][x] = BLOCK_EMPTY;
          changed = true;
        }
      } else if (cell === BLOCK_SPIKE_D) {
        if (
          y < grid.length - 1 &&
          getBlockProperties(nextGrid[y + 1][x], nextGrid)
            ?.canBeDestroyedByShooter
        ) {
          nextGrid[y + 1][x] = BLOCK_EMPTY;
          changed = true;
        }
      } else if (cell === BLOCK_SPIKE_L) {
        if (
          x > 0 &&
          getBlockProperties(nextGrid[y][x - 1], nextGrid)
            ?.canBeDestroyedByShooter
        ) {
          nextGrid[y][x - 1] = BLOCK_EMPTY;
          changed = true;
        }
      } else if (cell === BLOCK_SPIKE_R) {
        if (
          x < grid[y].length - 1 &&
          getBlockProperties(nextGrid[y][x + 1], nextGrid)
            ?.canBeDestroyedByShooter
        ) {
          nextGrid[y][x + 1] = BLOCK_EMPTY;
          changed = true;
        }
      }
    }
  }

  return { changed, grid: nextGrid };
};

/** Find adjacent matching blocks (including bomb adjacency). */
export const findMatches = (grid: CellType[][]): MatchResult => {
  let changed = false;
  const toClearKeys = new Set<string>();

  const dy = [-1, 1, 0, 0];
  const dx = [0, 0, -1, 1];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      // Only destroyable blocks (puzzle blocks + bombs) can match
      if (getBlockProperties(cell, grid)?.canBeDestroyedByShooter) {
        // Check neighbors
        for (let i = 0; i < 4; i++) {
          const ny = y + dy[i];
          const nx = x + dx[i];
          if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
            const neighbor = grid[ny][nx];
            if (getBlockProperties(neighbor, grid)?.canBeDestroyedByShooter) {
              if (
                cell === neighbor ||
                cell === BLOCK_BOMB ||
                neighbor === BLOCK_BOMB
              ) {
                toClearKeys.add(`${y},${x}`);
                toClearKeys.add(`${ny},${nx}`);
                changed = true;
              }
            }
          }
        }
      }
    }
  }

  return { changed, grid, toClearKeys };
};

/** Remove matched blocks from the grid. */
export const clearMatches = (
  grid: CellType[][],
  toClearKeys: Set<string>,
): CellType[][] => {
  const nextGrid = copyGrid(grid);
  toClearKeys.forEach((key) => {
    const [yStr, xStr] = key.split(",");
    const y = parseInt(yStr, 10);
    const x = parseInt(xStr, 10);
    const cell = nextGrid[y]?.[x];
    if (
      cell !== undefined &&
      getBlockProperties(cell, nextGrid)?.canBeDestroyedByShooter
    ) {
      nextGrid[y][x] = BLOCK_EMPTY;
    }
  });
  return nextGrid;
};

// ── Move block validation ──

/** Attempt to move a block (or stack) and return the resulting grid. */
export const tryMoveBlock = (
  currentGrid: CellType[][],
  x: number,
  y: number,
  dx: number,
  dy: number,
  flashingBlocks: Record<string, boolean>,
): MoveBlockResult => {
  const block = currentGrid[y]?.[x];
  const fail: MoveBlockResult = {
    success: false,
    grid: currentGrid,
    newCursorX: x,
    newCursorY: y,
  };

  if (
    block === undefined ||
    !getBlockProperties(block, currentGrid)?.canSelect
  ) {
    return fail;
  }

  // Check restrictions for moving walls
  if (block === BLOCK_WALL_H && dy !== 0) return fail;
  if (block === BLOCK_WALL_V && dx !== 0) return fail;
  // Standard match blocks can only slide horizontally
  if (block !== BLOCK_WALL_H && block !== BLOCK_WALL_V && dy !== 0) return fail;

  // Blocks with gravity must be supported underneath to slide horizontally
  if (getBlockProperties(block, currentGrid)?.canFall && dy === 0) {
    const isSupported =
      y === currentGrid.length - 1 || currentGrid[y + 1]?.[x] !== BLOCK_EMPTY;
    if (!isSupported) return fail;
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
        !getBlockProperties(aboveBlock, currentGrid)?.canSelect
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

  const matchResult = findMatches(currentGrid);

  if (
    blocked ||
    coords.some(
      (coord) =>
        flashingBlocks[`${coord.y},${coord.x}`] ||
        matchResult.toClearKeys.has(`${coord.y},${coord.x}`),
    )
  ) {
    return fail;
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

  return {
    success: true,
    grid: nextGrid,
    newCursorX: x + dx,
    newCursorY: y + dy,
  };
};
