import React from "react";

export default function TriangleDown() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#80a0ff" />
          <stop offset="60%" stopColor="#2040ee" />
          <stop offset="100%" stopColor="#051080" />
        </linearGradient>
      </defs>
      <polygon points="20,38 38,4 2,4" fill="url(#blueGrad)" stroke="#050515" strokeWidth="2.5" />
      <line x1="20" y1="38" x2="20" y2="4" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
      <polygon points="20,38 2,4 20,4" fill="#ffffff" fillOpacity="0.2" />
      <polygon points="20,38 38,4 20,4" fill="#000000" fillOpacity="0.25" />
    </svg>
  );
}
