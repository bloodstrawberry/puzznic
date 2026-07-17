import Image from "next/image";

export default function Bomb() {
  return (
    <Image
      src="/block/bomb.png"
      alt="Bomb"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}