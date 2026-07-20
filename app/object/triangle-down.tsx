import React from "react";
import { getBlockAssetPath } from "./constants";

export default function TriangleDown() {
  return (
    <img
      src={getBlockAssetPath("/block/triangle-down.png")}
      alt="TriangleDown"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
