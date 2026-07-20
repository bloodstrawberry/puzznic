import React from "react";
import { getBlockAssetPath } from "./constants";

export default function Heart() {
  return (
    <img
      src={getBlockAssetPath("/block/heart.png")}
      alt="Heart"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
