import React from "react";
import { getBlockAssetPath } from "./constants";

export default function Diamond() {
  return (
    <img
      src={getBlockAssetPath("/block/diamond.png")}
      alt="Diamond"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
