import React from "react";

export default function WallH() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="wallGradH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8090a0" />
          <stop offset="50%" stopColor="#404850" />
          <stop offset="100%" stopColor="#202428" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" fill="url(#wallGradH)" stroke="#050515" strokeWidth="2.5" />
      {/* Metallic horizontal rails */}
      <line x1="2" y1="8" x2="38" y2="8" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="2" y1="32" x2="38" y2="32" stroke="#000000" strokeOpacity="0.4" strokeWidth="1.5" />
      {/* Left/Right chevron arrows */}
      <polygon points="8,20 14,26 14,14" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
      <polygon points="32,20 26,26 26,14" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
      {/* Core handle block */}
      <rect x="17" y="13" width="6" height="14" fill="#1f2937" stroke="#fbbf24" strokeWidth="1" />
    </svg>
  );
}
