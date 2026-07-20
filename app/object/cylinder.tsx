import React from "react";
import { getBlockAssetPath } from "./constants";

export default function Cylinder() {
  return (
    <img
      src={getBlockAssetPath("/block/cylinder.png")}
      alt="Cylinder"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
