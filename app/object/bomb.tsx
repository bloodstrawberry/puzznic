import React from "react";

export default function Bomb() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <radialGradient id="bombGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#888888" />
          <stop offset="40%" stopColor="#3a3a3a" />
          <stop offset="85%" stopColor="#1c1c1c" />
          <stop offset="100%" stopColor="#080808" />
        </radialGradient>
        <radialGradient id="sparkGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#ffcc00" />
          <stop offset="80%" stopColor="#ff3300" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* Fuse */}
      <path
        d="M 20 10 Q 24 3 30 6"
        fill="none"
        stroke="#d2b48c"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Spark */}
      <circle cx="30" cy="6" r="4.5" fill="url(#sparkGrad)" />
      <path
        d="M 30 6 L 35 2 M 30 6 L 33 11 M 30 6 L 25 3 M 30 6 L 27 9"
        stroke="#ff6600"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Bomb Cap */}
      <rect
        x="17"
        y="10"
        width="6"
        height="3.5"
        rx="1"
        fill="#555555"
        stroke="#050515"
        strokeWidth="1.5"
      />
      {/* Bomb Body */}
      <circle
        cx="20"
        cy="24"
        r="12.5"
        fill="url(#bombGrad)"
        stroke="#050515"
        strokeWidth="2.5"
      />
      {/* Highlight reflection */}
      <circle
        cx="16.5"
        cy="20.5"
        r="3"
        fill="#ffffff"
        fillOpacity="0.3"
        filter="blur(0.5px)"
      />
    </svg>
  );
}
