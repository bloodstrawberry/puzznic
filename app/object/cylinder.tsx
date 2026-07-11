import React from "react";

export default function Cylinder() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#b3ffb3" />
        <stop offset="40%" stopColor="#33cc33" />
        <stop offset="85%" stopColor="#008000" />
        <stop offset="100%" stopColor="#003300" />
      </linearGradient>
      <path d="M 6,10 A 14,5 0 0,0 34,10 L 34,30 A 14,5 0 0,1 6,30 Z" fill="url(#greenGrad)" stroke="#050515" strokeWidth="2.5" />
      <ellipse cx="20" cy="10" rx="14" ry="5" fill="#a3ffa3" stroke="#050515" strokeWidth="2.5" />
    </svg>
  );
}
