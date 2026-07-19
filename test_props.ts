import { getBlockProperties } from "./app/object/constants.ts";

const grid = [
  [81, 0, 81, 0, 82, 0, 82, 0, 1, 83]
];

console.log("BLOCK 81:");
console.log(getBlockProperties(81, grid as any));

console.log("BLOCK 82:");
console.log(getBlockProperties(82, grid as any));
