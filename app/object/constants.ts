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
];

// Sizing and spacing constants for blocks on the stage play board
// Adjust these to change the visual padding/spacing between blocks.
export const STAGE_BLOCK_SIZE_PERCENT = 88; // Block size percentage relative to the grid cell (e.g. 88% width/height, leaving 12% padding)
export const STAGE_GRID_GAP_REM = 0.125;   // Gap between grid cells in rem (0.125rem = 2px, equivalent to Tailwind's gap-0.5)

