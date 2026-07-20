import React from "react";
import { getBlockAssetPath } from "./constants";

function WallAutoH() {
  return (
    <img
      src={getBlockAssetPath("/block/wall-auto-h.png")}
      alt="WallAutoH"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}

export default React.memo(WallAutoH);
