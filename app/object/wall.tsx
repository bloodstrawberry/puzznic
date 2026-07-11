import React from "react";

export default function Wall() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#d9d9d9" />
          <stop offset="75%" stopColor="#8c8c8c" />
          <stop offset="100%" stopColor="#404040" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="37" height="37" fill="url(#wallGrad)" stroke="#050515" strokeWidth="2.5" />
      <line x1="2" y1="2" x2="38" y2="38" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
      <line x1="2" y1="38" x2="38" y2="2" stroke="#000000" strokeOpacity="0.3" strokeWidth="1.5" />
      <rect x="7" y="7" width="26" height="26" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" />
      <rect x="8" y="8" width="24" height="24" fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="1.5" />
    </svg>
  );
}
