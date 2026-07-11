import React from "react";

export default function Diamond() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff2a3" />
          <stop offset="40%" stopColor="#ffd700" />
          <stop offset="80%" stopColor="#c59b00" />
          <stop offset="100%" stopColor="#664d00" />
        </linearGradient>
      </defs>
      <polygon points="20,2 38,20 20,38 2,20" fill="url(#goldGrad)" stroke="#050515" strokeWidth="2.5" />
      <line x1="20" y1="2" x2="20" y2="38" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" />
      <line x1="2" y1="20" x2="38" y2="20" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" />
      <polygon points="20,20 20,2 2,20" fill="#ffffff" fillOpacity="0.15" />
      <polygon points="20,20 20,38 38,20" fill="#000000" fillOpacity="0.25" />
    </svg>
  );
}
