import React from "react";

export default function Cross() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="crossGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe0cc" />
          <stop offset="45%" stopColor="#ff6600" />
          <stop offset="100%" stopColor="#993300" />
        </linearGradient>
      </defs>
      <polygon
        points="14,4 26,4 26,14 36,14 36,26 26,26 26,36 14,36 14,26 4,26 4,14 14,14"
        fill="url(#crossGrad)"
        stroke="#050515"
        strokeWidth="2.5"
      />
      <line x1="14" y1="14" x2="26" y2="26" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" />
      <line x1="26" y1="14" x2="14" y2="26" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" />
    </svg>
  );
}
