import Image from "next/image";

export default function Cross() {
  return (
    <Image
      src="/block/cross.png"
      alt="Cross"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}
