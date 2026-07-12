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
} from "./constants";
import Wall from "./wall";
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
export * from "./constants";

interface BlockRendererProps {
  id: number;
}

export default function BlockRenderer({ id }: BlockRendererProps) {
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
    default:
      return null;
  }
}
