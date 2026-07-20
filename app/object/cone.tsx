import React from "react";
import { getBlockAssetPath } from "./constants";

export default function Cone() {
  return (
    <img
      src={getBlockAssetPath("/block/cone.png")}
      alt="Cone"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
