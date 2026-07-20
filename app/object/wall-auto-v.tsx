import React from "react";
import { getBlockAssetPath } from "./constants";

function WallAutoV() {
  return (
    <img
      src={getBlockAssetPath("/block/wall-auto-v.png")}
      alt="WallAutoV"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}

export default React.memo(WallAutoV);
