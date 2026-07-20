import React from "react";
import { getBlockAssetPath } from "./constants";

export default function Bomb() {
  return (
    <img
      src={getBlockAssetPath("/block/bomb.png")}
      alt="Bomb"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
