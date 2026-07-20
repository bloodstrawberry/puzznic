import React from "react";
import { getBlockAssetPath } from "./constants";

interface LetterBlockProps {
  letter: string;
  active: boolean;
}

export default function LetterBlock({ letter }: LetterBlockProps) {
  return (
    <div className="w-full h-full relative select-none">
      <img
        src={getBlockAssetPath(`/block/alphabet-${letter}.png`)}
        alt={`Alphabet ${letter}`}
        className="w-full h-full object-contain pointer-events-none select-none"
      />
    </div>
  );
}
