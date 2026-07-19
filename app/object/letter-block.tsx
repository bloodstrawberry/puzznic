import React from "react";
import Image from "next/image";

interface LetterBlockProps {
  letter: string;
  active: boolean;
}

export default function LetterBlock({ letter }: LetterBlockProps) {
  return (
    <div className="w-full h-full relative select-none">
      <Image
        src={`/block/alphabet-${letter}.png`}
        alt={`Alphabet ${letter}`}
        className="w-full h-full object-contain"
        width={40}
        height={40}
      />
    </div>
  );
}
