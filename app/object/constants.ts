export const BLOCK_EMPTY = 0;
export const BLOCK_WALL = 1;
export const BLOCK_SPHERE = 2;
export const BLOCK_DIAMOND = 3;
export const BLOCK_CUBE = 4;
export const BLOCK_CONE = 5;
export const BLOCK_STAR = 6;
export const BLOCK_CYLINDER = 7;
export const BLOCK_TRIANGLE_DOWN = 8;
export const BLOCK_HEART = 9;
export const BLOCK_MOON = 10;
export const BLOCK_CROSS = 11;
export const BLOCK_WALL_V = 20;
export const BLOCK_WALL_H = 21;
export const BLOCK_AUTO_WALL_V = 22;
export const BLOCK_AUTO_WALL_H = 23;
export const BLOCK_BOMB = 30;
export const BLOCK_SHOOTER_L = 31;
export const BLOCK_SHOOTER_R = 32;
export const BLOCK_SHOOTER_L_ONCE = 33;
export const BLOCK_SHOOTER_R_ONCE = 34;
export const BLOCK_SPIKE_U = 40;
export const BLOCK_SPIKE_D = 41;
export const BLOCK_SPIKE_L = 42;
export const BLOCK_SPIKE_R = 43;

export const BLOCK_NUM_1 = 71;
export const BLOCK_NUM_2 = 72;
export const BLOCK_NUM_3 = 73;
export const BLOCK_NUM_4 = 74;
export const BLOCK_NUM_5 = 75;

export const BLOCK_LETTER_A = 81;
export const BLOCK_LETTER_B = 82;
export const BLOCK_LETTER_C = 83;
export const BLOCK_LETTER_D = 84;
export const BLOCK_LETTER_E = 85;

export type BlockId = number;

// Array of matchable puzzle block types (10 types in total)
export const PUZZLE_BLOCK_TYPES: BlockId[] = [
  BLOCK_SPHERE,
  BLOCK_DIAMOND,
  BLOCK_CUBE,
  BLOCK_CONE,
  BLOCK_STAR,
  BLOCK_CYLINDER,
  BLOCK_TRIANGLE_DOWN,
  BLOCK_HEART,
  BLOCK_MOON,
  BLOCK_CROSS,
  BLOCK_NUM_1,
  BLOCK_NUM_2,
  BLOCK_NUM_3,
  BLOCK_NUM_4,
  BLOCK_NUM_5,
  BLOCK_LETTER_A,
  BLOCK_LETTER_B,
  BLOCK_LETTER_C,
  BLOCK_LETTER_D,
  BLOCK_LETTER_E,
];

// Sizing and spacing constants for blocks on the stage play board
// Adjust these to change the visual padding/spacing between blocks.
export const STAGE_BLOCK_SIZE_PERCENT = 100; // Block size percentage relative to the grid cell (e.g. 88% width/height, leaving 12% padding)
export const STAGE_GRID_GAP_REM = 0.0;   // Gap between grid cells in rem (0.125rem = 2px, equivalent to Tailwind's gap-0.5)

export interface BlockProperties {
  canSelect: boolean;
  canBeDestroyedByShooter: boolean;
  canFall: boolean;
}

export const BLOCK_PROPERTIES: Record<BlockId, BlockProperties> = {
  [BLOCK_EMPTY]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_WALL]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_SPHERE]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_DIAMOND]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_CUBE]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_CONE]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_STAR]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_CYLINDER]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_TRIANGLE_DOWN]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_HEART]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_MOON]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_CROSS]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_WALL_V]: { canSelect: true, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_WALL_H]: { canSelect: true, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_AUTO_WALL_V]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_AUTO_WALL_H]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_BOMB]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_SHOOTER_L]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_SHOOTER_R]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_SHOOTER_L_ONCE]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_SHOOTER_R_ONCE]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_SPIKE_U]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_SPIKE_D]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_SPIKE_L]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_SPIKE_R]: { canSelect: false, canBeDestroyedByShooter: false, canFall: false },
  [BLOCK_NUM_1]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_NUM_2]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_NUM_3]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_NUM_4]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_NUM_5]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_LETTER_A]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_LETTER_B]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_LETTER_C]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_LETTER_D]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
  [BLOCK_LETTER_E]: { canSelect: true, canBeDestroyedByShooter: true, canFall: true },
};

export function isBlockActive(id: BlockId, grid?: BlockId[][]): boolean {
  if (id < BLOCK_NUM_1 || id > BLOCK_NUM_5) {
    return true;
  }
  if (!grid) {
    return true; // Default to active if grid is not provided (e.g. editor panel)
  }

  // Active if there are no smaller number blocks present on the grid.
  for (let prevId = BLOCK_NUM_1; prevId < id; prevId++) {
    for (let r = 0; r < grid.length; r++) {
      if (grid[r].includes(prevId)) {
        return false;
      }
    }
  }
  return true;
}

export function getBlockProperties(id: BlockId, grid?: BlockId[][]): BlockProperties {
  const staticProps = BLOCK_PROPERTIES[id] ?? {
    canSelect: false,
    canBeDestroyedByShooter: false,
    canFall: false,
  };

  if (id >= BLOCK_NUM_1 && id <= BLOCK_NUM_5) {
    if (grid) {
      const active = isBlockActive(id, grid);
      if (active) {
        return { canSelect: true, canBeDestroyedByShooter: true, canFall: true };
      } else {
        return { canSelect: false, canBeDestroyedByShooter: false, canFall: false };
      }
    }
  }

  if (id >= BLOCK_LETTER_A && id <= BLOCK_LETTER_E) {
    if (grid) {
      const active = isLetterBlockActive(id, grid);
      return {
        canSelect: true,
        canBeDestroyedByShooter: active,
        canFall: true,
      };
    }
  }

  return staticProps;
}

export function isLetterBlockActive(id: BlockId, grid?: BlockId[][]): boolean {
  if (id < BLOCK_LETTER_A || id > BLOCK_LETTER_E) {
    return true;
  }
  if (!grid) {
    return true; // Default to active if grid is not provided
  }

  // Active (can be destroyed) if there are no smaller letter blocks present on the grid.
  for (let prevId = BLOCK_LETTER_A; prevId < id; prevId++) {
    for (let r = 0; r < grid.length; r++) {
      if (grid[r].includes(prevId)) {
        return false;
      }
    }
  }
  return true;
}
