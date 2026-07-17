import Image from "next/image";

export default function Cylinder() {
  return (
    <Image
      src="/block/cylinder.png"
      alt="Cylinder"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}