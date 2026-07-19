import React from "react";

interface NumBlockProps {
  num: number;
  active: boolean;
}

export default function NumBlock({ num, active }: NumBlockProps) {
  // Determine color theme based on block number
  let themeClass = "";
  switch (num) {
    case 1:
      themeClass = "from-amber-400 via-amber-500 to-orange-600 border-amber-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(245,158,11,0.4)]";
      break;
    case 2:
      themeClass = "from-emerald-400 via-emerald-500 to-teal-600 border-emerald-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(16,185,129,0.4)]";
      break;
    case 3:
      themeClass = "from-sky-400 via-sky-500 to-blue-600 border-sky-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(14,165,233,0.4)]";
      break;
    case 4:
      themeClass = "from-purple-400 via-purple-500 to-indigo-600 border-purple-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(168,85,247,0.4)]";
      break;
    case 5:
      themeClass = "from-pink-400 via-pink-500 to-rose-600 border-pink-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(236,72,153,0.4)]";
      break;
    default:
      themeClass = "from-zinc-400 via-zinc-500 to-zinc-600 border-zinc-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(156,163,175,0.4)]";
  }

  return (
    <div
      className={`w-full h-full rounded-lg border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 select-none ${
        active
          ? `bg-gradient-to-br ${themeClass} border-t-white/30 border-l-white/20 border-r-black/30 border-b-black/40`
          : "bg-zinc-800/80 border-zinc-700/60 shadow-inner opacity-45 grayscale contrast-75"
      }`}
    >
      {/* Glossy overlay effect for active blocks */}
      {active && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      )}

      {/* Number text */}
      <span
        className={`font-press-start text-xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] font-bold transition-all duration-300 select-none ${
          active ? "text-white scale-110" : "text-zinc-500 scale-95"
        }`}
      >
        {num}
      </span>

      {/* Locked Padlock overlay when inactive */}
      {!active && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
          <svg
            className="w-4 h-4 text-zinc-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
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
