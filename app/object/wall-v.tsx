import React from "react";
import { getBlockAssetPath } from "./constants";

export default function WallV() {
  return (
    <img
      src={getBlockAssetPath("/block/wall-v.png")}
      alt="WallV"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
