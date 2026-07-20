import React from "react";
import { getBlockAssetPath } from "./constants";

export default function Star() {
  return (
    <img
      src={getBlockAssetPath("/block/star.png")}
      alt="Star"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
