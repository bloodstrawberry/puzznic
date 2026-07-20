import React from "react";
import { getBlockAssetPath } from "./constants";

export default function Sphere() {
  return (
    <img
      src={getBlockAssetPath("/block/sphere.png")}
      alt="Sphere"
      className="w-full h-full object-contain pointer-events-none select-none"
    />
  );
}
