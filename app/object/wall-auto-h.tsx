import React from "react";
import Image from "next/image";

function WallAutoH() {
  return (
    <Image
      src="/block/wall-auto-h.png"
      alt="WallAutoH"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}

export default React.memo(WallAutoH);
