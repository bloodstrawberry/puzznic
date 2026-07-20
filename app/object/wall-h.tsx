import React from "react";
import { getBlockAssetPath } from "./constants";

export default function WallH() {
  return (
    <img
      src={getBlockAssetPath("/block/wall-h.png")}
      alt="WallH"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
