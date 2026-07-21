"use client";

import { useState, useEffect } from "react";
import { getBlockAssetPath } from "./constants";

export const ALL_BLOCK_IMAGE_PATHS: readonly string[] = [
  "/block/alphabet-A.png",
  "/block/alphabet-B.png",
  "/block/alphabet-C.png",
  "/block/alphabet-D.png",
  "/block/alphabet-E.png",
  "/block/bomb.png",
  "/block/cone.png",
  "/block/cross.png",
  "/block/cube.png",
  "/block/cylinder.png",
  "/block/diamond.png",
  "/block/heart.png",
  "/block/moon.png",
  "/block/number-1.png",
  "/block/number-2.png",
  "/block/number-3.png",
  "/block/number-4.png",
  "/block/number-5.png",
  "/block/sphere.png",
  "/block/star.png",
  "/block/tmp.png",
  "/block/tmp2.png",
  "/block/tmp3.png",
  "/block/triangle-down.png",
  "/block/wall-auto-h.png",
  "/block/wall-auto-v.png",
  "/block/wall-h.png",
  "/block/wall-v.png",
  "/block/wall.png",
];

let preloadPromise: Promise<void> | null = null;

export function preloadAllBlockImages(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = Promise.all(
    ALL_BLOCK_IMAGE_PATHS.map((relPath) => {
      const src = getBlockAssetPath(relPath);
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;

        const handleComplete = () => {
          if ("decode" in img && typeof img.decode === "function") {
            img.decode().then(resolve).catch(resolve);
          } else {
            resolve();
          }
        };

        if (img.complete) {
          handleComplete();
        } else {
          img.onload = handleComplete;
          img.onerror = () => resolve();
        }
      });
    }),
  ).then(() => {});

  return preloadPromise;
}

export function useBlockImagesPreloader(): boolean {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    preloadAllBlockImages().then(() => {
      if (mounted) {
        setIsLoaded(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return isLoaded;
}
