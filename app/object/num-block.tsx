import React from "react";
import Image from "next/image";

interface NumBlockProps {
  num: number;
  active: boolean;
}

export default function NumBlock({ num, active }: NumBlockProps) {
  return (
    <div className="w-full h-full relative select-none">
      <Image
        src={`/block/number-${num}.png`}
        alt={`Number ${num}`}
        className={`w-full h-full object-contain transition-all duration-300 ${
          active ? "" : "grayscale opacity-50"
        }`}
        width={40}
        height={40}
      />
    </div>
  );
}
