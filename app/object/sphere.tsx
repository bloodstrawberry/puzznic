import React from "react";

export default function Sphere() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <radialGradient id="sphereGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffb3b3" />
          <stop offset="30%" stopColor="#ff3333" />
          <stop offset="85%" stopColor="#b30000" />
          <stop offset="100%" stopColor="#4d0000" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#sphereGrad)" stroke="#050515" strokeWidth="2.5" />
      <circle cx="15" cy="15" r="4.5" fill="#ffffff" fillOpacity="0.45" filter="blur(0.5px)" />
    </svg>
  );
}
