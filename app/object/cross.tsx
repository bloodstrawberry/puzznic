import React from "react";
import { getBlockAssetPath } from "./constants";

export default function Cross() {
  return (
    <img
      src={getBlockAssetPath("/block/cross.png")}
      alt="Cross"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
