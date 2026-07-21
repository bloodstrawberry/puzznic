import React from "react";
import {
  BLOCK_WALL,
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
  BLOCK_NUM_1,
  BLOCK_NUM_2,
  BLOCK_NUM_3,
  BLOCK_NUM_4,
  BLOCK_NUM_5,
  isBlockActive,
  BLOCK_LETTER_A,
  BLOCK_LETTER_B,
  BLOCK_LETTER_C,
  BLOCK_LETTER_D,
  BLOCK_LETTER_E,
  isLetterBlockActive,
} from "./constants";
import Wall from "./wall";
import Spike from "./spike";
import Sphere from "./sphere";
import Diamond from "./diamond";
import Cube from "./cube";
import Cone from "./cone";
import Star from "./star";
import Cylinder from "./cylinder";
import TriangleDown from "./triangle-down";
import Heart from "./heart";
import Moon from "./moon";
import Cross from "./cross";
import WallV from "./wall-v";
import WallH from "./wall-h";
import WallAutoV from "./wall-auto-v";
import WallAutoH from "./wall-auto-h";
import Bomb from "./bomb";
import Shooter from "./shooter";
import NumBlock from "./num-block";
import LetterBlock from "./letter-block";

export { default as Wall } from "./wall";
export { default as Sphere } from "./sphere";
export { default as Diamond } from "./diamond";
export { default as Cube } from "./cube";
export { default as Cone } from "./cone";
export { default as Star } from "./star";
export { default as Cylinder } from "./cylinder";
export { default as TriangleDown } from "./triangle-down";
export { default as Heart } from "./heart";
export { default as Moon } from "./moon";
export { default as Cross } from "./cross";
export { default as WallV } from "./wall-v";
export { default as WallH } from "./wall-h";
export { default as WallAutoV } from "./wall-auto-v";
export { default as WallAutoH } from "./wall-auto-h";
export { default as Bomb } from "./bomb";
export { default as Shooter } from "./shooter";
export { default as Spike } from "./spike";
export { default as NumBlock } from "./num-block";
export { default as LetterBlock } from "./letter-block";
export * from "./constants";
export * from "./preload";

interface BlockRendererProps {
  id: number;
  x?: number;
  y?: number;
  grid?: number[][];
  firedOnce?: Record<string, boolean>;
}

export default function BlockRenderer({
  id,
  x,
  y,
  grid,
  firedOnce,
}: BlockRendererProps) {
  const key = `${y},${x}`;
  const isFiredOnce = firedOnce !== undefined && firedOnce[key] === true;

  const active = isBlockActive(id, grid);
  const letterActive = isLetterBlockActive(id, grid);

  const isPressed =
    isFiredOnce ||
    (grid !== undefined &&
      y !== undefined &&
      x !== undefined &&
      y > 0 &&
      grid[y - 1]?.[x] !== undefined &&
      grid[y - 1][x] !== 0); // BLOCK_EMPTY = 0

  switch (id) {
    case BLOCK_WALL:
      return <Wall />;
    case BLOCK_SPHERE:
      return <Sphere />;
    case BLOCK_DIAMOND:
      return <Diamond />;
    case BLOCK_CUBE:
      return <Cube />;
    case BLOCK_CONE:
      return <Cone />;
    case BLOCK_STAR:
      return <Star />;
    case BLOCK_CYLINDER:
      return <Cylinder />;
    case BLOCK_TRIANGLE_DOWN:
      return <TriangleDown />;
    case BLOCK_HEART:
      return <Heart />;
    case BLOCK_MOON:
      return <Moon />;
    case BLOCK_CROSS:
      return <Cross />;
    case BLOCK_WALL_V:
      return <WallV />;
    case BLOCK_WALL_H:
      return <WallH />;
    case BLOCK_AUTO_WALL_V:
      return <WallAutoV />;
    case BLOCK_AUTO_WALL_H:
      return <WallAutoH />;
    case BLOCK_BOMB:
      return <Bomb />;
    case BLOCK_SHOOTER_L:
      return <Shooter direction="left" mode="repeated" isPressed={isPressed} />;
    case BLOCK_SHOOTER_R:
      return (
        <Shooter direction="right" mode="repeated" isPressed={isPressed} />
      );
    case BLOCK_SHOOTER_L_ONCE:
      return <Shooter direction="left" mode="once" isPressed={isPressed} />;
    case BLOCK_SHOOTER_R_ONCE:
      return <Shooter direction="right" mode="once" isPressed={isPressed} />;
    case BLOCK_SPIKE_U:
      return <Spike direction="up" />;
    case BLOCK_SPIKE_D:
      return <Spike direction="down" />;
    case BLOCK_SPIKE_L:
      return <Spike direction="left" />;
    case BLOCK_SPIKE_R:
      return <Spike direction="right" />;
    case BLOCK_NUM_1:
      return <NumBlock num={1} active={active} />;
    case BLOCK_NUM_2:
      return <NumBlock num={2} active={active} />;
    case BLOCK_NUM_3:
      return <NumBlock num={3} active={active} />;
    case BLOCK_NUM_4:
      return <NumBlock num={4} active={active} />;
    case BLOCK_NUM_5:
      return <NumBlock num={5} active={active} />;
    case BLOCK_LETTER_A:
      return <LetterBlock letter="A" active={letterActive} />;
    case BLOCK_LETTER_B:
      return <LetterBlock letter="B" active={letterActive} />;
    case BLOCK_LETTER_C:
      return <LetterBlock letter="C" active={letterActive} />;
    case BLOCK_LETTER_D:
      return <LetterBlock letter="D" active={letterActive} />;
    case BLOCK_LETTER_E:
      return <LetterBlock letter="E" active={letterActive} />;
    default:
      return null;
  }
}
