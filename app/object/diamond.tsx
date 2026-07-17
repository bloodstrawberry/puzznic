import Image from "next/image";

export default function Diamond() {
  return (
    <Image
      src="/block/diamond.png"
      alt="Diamond"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}