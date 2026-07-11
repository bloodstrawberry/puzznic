export const BLOCK_EMPTY = 0;
export const BLOCK_WALL = 1;
export const BLOCK_SPHERE = 2;
export const BLOCK_DIAMOND = 3;
export const BLOCK_CUBE = 4;
export const BLOCK_CONE = 5;
export const BLOCK_STAR = 6;
export const BLOCK_CYLINDER = 7;
export const BLOCK_TRIANGLE_DOWN = 8;

export type BlockId = number;

// Array of matchable puzzle block types
export const PUZZLE_BLOCK_TYPES: BlockId[] = [
  BLOCK_SPHERE,
  BLOCK_DIAMOND,
  BLOCK_CUBE,
  BLOCK_CONE,
  BLOCK_STAR,
  BLOCK_CYLINDER,
  BLOCK_TRIANGLE_DOWN,
];
