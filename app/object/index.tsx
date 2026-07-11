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
} from "./constants";
import Wall from "./wall";
import Sphere from "./sphere";
import Diamond from "./diamond";
import Cube from "./cube";
import Cone from "./cone";
import Star from "./star";
import Cylinder from "./cylinder";
import TriangleDown from "./triangle-down";

export { default as Wall } from "./wall";
export { default as Sphere } from "./sphere";
export { default as Diamond } from "./diamond";
export { default as Cube } from "./cube";
export { default as Cone } from "./cone";
export { default as Star } from "./star";
export { default as Cylinder } from "./cylinder";
export { default as TriangleDown } from "./triangle-down";
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
    default:
      return null;
  }
}
