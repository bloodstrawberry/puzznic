import Image from "next/image";

export default function Cube() {
  return (
    <Image
      src="/block/cube.png"
      alt="Cube"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}