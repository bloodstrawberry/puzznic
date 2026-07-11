import React from "react";

export default function Cone() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a3ffff" />
          <stop offset="60%" stopColor="#00cccc" />
          <stop offset="100%" stopColor="#006666" />
        </linearGradient>
      </defs>
      <polygon points="20,2 38,36 2,36" fill="url(#cyanGrad)" stroke="#050515" strokeWidth="2.5" />
      <line x1="20" y1="2" x2="20" y2="36" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
      <polygon points="20,2 2,36 20,36" fill="#ffffff" fillOpacity="0.2" />
      <polygon points="20,2 38,36 20,36" fill="#000000" fillOpacity="0.25" />
    </svg>
  );
}
