import Image from "next/image";

export default function Heart() {
  return (
    <Image
      src="/block/heart.png"
      alt="Heart"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}