import Image from "next/image";

export default function Cone() {
  return (
    <Image
      src="/block/cone.png"
      alt="Cone"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}
