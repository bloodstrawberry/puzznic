import React from "react";
import { getBlockAssetPath } from "./constants";

export default function Moon() {
  return (
    <img
      src={getBlockAssetPath("/block/moon.png")}
      alt="Moon"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
