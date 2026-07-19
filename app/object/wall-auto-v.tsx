import React from "react";
import Image from "next/image";

function WallAutoV() {
  return (
    <Image
      src="/block/wall-auto-v.png"
      alt="WallAutoV"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}

export default React.memo(WallAutoV);
