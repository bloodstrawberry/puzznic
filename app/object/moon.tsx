import React from "react";

export default function Moon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <radialGradient id="moonGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffcc" />
          <stop offset="30%" stopColor="#fef08a" />
          <stop offset="75%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </radialGradient>
      </defs>
      {/* Outer glow shadow */}
      <path
        d="M 22,6 A 14,14 0 0,1 22,34 A 18,18 0 0,0 22,6 Z"
        fill="#fef08a"
        opacity="0.15"
        transform="scale(1.08) translate(-1.5, -1.5)"
      />
      {/* Moon Body */}
      <path
        d="M 22,6 A 14,14 0 0,1 22,34 A 18,18 0 0,0 22,6 Z"
        fill="url(#moonGrad)"
        stroke="#050515"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner highlight gloss */}
      <path
        d="M 23,8 A 12,12 0 0,1 23,32"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />
      {/* Sparkle star */}
      <circle cx="14" cy="18" r="1" fill="#ffffff" fillOpacity="0.8" />
    </svg>
  );
}
