import Image from "next/image";

export default function Wall() {
  return (
    <Image
      src="/block/wall.png"
      alt="Wall"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}