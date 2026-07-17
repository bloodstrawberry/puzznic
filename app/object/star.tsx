import Image from "next/image";

export default function Star() {
  return (
    <Image
      src="/block/star.png"
      alt="Star"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}