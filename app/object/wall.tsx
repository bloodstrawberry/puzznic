import React from "react";
import { getBlockAssetPath } from "./constants";

export default function Wall() {
  return (
    <img
      src={getBlockAssetPath("/block/wall.png")}
      alt="Wall"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
