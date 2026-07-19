import Image from "next/image";

export default function WallV() {
  return (
    <Image
      src="/block/wall-v.png"
      alt="WallV"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}