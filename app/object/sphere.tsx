import Image from "next/image";

export default function Sphere() {
  return (
    <Image
      src="/block/sphere.png"
      alt="Sphere"
      className="w-full h-full object-contain"
      width={40}
      height={40}
    />
  );
}