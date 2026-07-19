import React from "react";

interface LetterBlockProps {
  letter: string;
  active: boolean;
}

export default function LetterBlock({ letter, active }: LetterBlockProps) {
  // Determine color theme based on block letter
  let themeClass = "";
  switch (letter) {
    case "A":
      themeClass = "from-blue-500 via-indigo-500 to-purple-600 border-blue-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(99,102,241,0.4)]";
      break;
    case "B":
      themeClass = "from-fuchsia-500 via-pink-500 to-rose-600 border-fuchsia-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(236,72,153,0.4)]";
      break;
    case "C":
      themeClass = "from-emerald-500 via-emerald-600 to-teal-700 border-emerald-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(16,185,129,0.4)]";
      break;
    case "D":
      themeClass = "from-orange-500 via-amber-500 to-red-600 border-orange-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(239,68,68,0.4)]";
      break;
    case "E":
      themeClass = "from-sky-500 via-cyan-500 to-blue-600 border-sky-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(14,165,233,0.4)]";
      break;
    default:
      themeClass = "from-zinc-500 via-zinc-600 to-zinc-700 border-zinc-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(156,163,175,0.4)]";
  }

  return (
    <div
      className={`w-full h-full rounded-lg border-2 flex flex-col items-center justify-center relative overflow-hidden select-none bg-gradient-to-br ${themeClass} ${
        active
          ? "border-t-white/30 border-l-white/20 border-r-black/30 border-b-black/40"
          : "border-zinc-500/50 border-t-white/20 border-l-white/10 border-r-black/20 border-b-black/30 opacity-80"
      }`}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

      {/* Letter text */}
      <span
        className={`font-press-start text-xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] font-bold select-none text-white ${
          active ? "scale-110" : "scale-95 text-white/80"
        }`}
      >
        {letter}
      </span>

      {/* Tiny Locked Padlock overlay in the corner when inactive (can still move, but cannot destroy) */}
      {!active && (
        <div className="absolute bottom-1 right-1 flex items-center justify-center p-0.5 rounded bg-black/40 border border-white/10 pointer-events-none">
          <svg
            className="w-3 h-3 text-yellow-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
