import React from "react";

export default function WallV() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="wallGradV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8090a0" />
          <stop offset="50%" stopColor="#404850" />
          <stop offset="100%" stopColor="#202428" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" fill="url(#wallGradV)" stroke="#050515" strokeWidth="2.5" />
      {/* Metallic vertical rails */}
      <line x1="8" y1="2" x2="8" y2="38" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="32" y1="2" x2="32" y2="38" stroke="#000000" strokeOpacity="0.4" strokeWidth="1.5" />
      {/* Up/Down chevron arrows */}
      <polygon points="20,8 26,14 14,14" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
      <polygon points="20,32 26,26 14,26" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
      {/* Core handle block */}
      <rect x="13" y="17" width="14" height="6" fill="#1f2937" stroke="#fbbf24" strokeWidth="1" />
    </svg>
  );
}
