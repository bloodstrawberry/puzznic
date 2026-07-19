import Image from "next/image";

export default function WallH() {
  return (
    <Image
      src="/block/wall-h.png"
      alt="WallH"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}