import React from "react";

export default function Star() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <radialGradient id="silverGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#d9d9d9" />
          <stop offset="100%" stopColor="#737373" />
        </radialGradient>
      </defs>
      <polygon points="20,2 25,14 38,14 28,23 32,36 20,28 8,36 12,23 2,14 15,14" fill="url(#silverGrad)" stroke="#050515" strokeWidth="2.5" />
      <polygon points="20,28 20,2 25,14" fill="#ffffff" fillOpacity="0.2" />
      <polygon points="20,28 20,2 15,14" fill="#000000" fillOpacity="0.2" />
    </svg>
  );
}
