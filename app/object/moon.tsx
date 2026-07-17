import Image from "next/image";

export default function Moon() {
  return (
    <Image
      src="/block/moon.png"
      alt="Moon"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}