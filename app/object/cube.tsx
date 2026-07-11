import React from "react";

export default function Cube() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="pinkGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb3f0" />
          <stop offset="50%" stopColor="#ff33cc" />
          <stop offset="100%" stopColor="#990066" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="32" height="32" rx="3" fill="url(#pinkGrad)" stroke="#050515" strokeWidth="2.5" />
      <line x1="4" y1="4" x2="36" y2="36" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" />
      <polygon points="4,4 36,4 36,36" fill="#ffffff" fillOpacity="0.1" />
      <polygon points="4,36 36,36 4,4" fill="#000000" fillOpacity="0.2" />
      <rect x="10" y="10" width="20" height="20" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
    </svg>
  );
}
