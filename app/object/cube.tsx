import React from "react";
import { getBlockAssetPath } from "./constants";

export default function Cube() {
  return (
    <img
      src={getBlockAssetPath("/block/cube.png")}
      alt="Cube"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
