import React from "react";
import { getBlockAssetPath } from "./constants";

interface NumBlockProps {
  num: number;
  active: boolean;
}

export default function NumBlock({ num, active }: NumBlockProps) {
  return (
    <div className="w-full h-full relative select-none">
      <img
        src={getBlockAssetPath(`/block/number-${num}.png`)}
        alt={`Number ${num}`}
        className={`w-full h-full object-contain pointer-events-none select-none transition-all duration-300 ${
          active ? "" : "grayscale opacity-50"
        }`}
      />
    </div>
  );
}
