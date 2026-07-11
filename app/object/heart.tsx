import React from "react";

export default function Heart() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <radialGradient id="heartGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffb3d9" />
          <stop offset="35%" stopColor="#ff3399" />
          <stop offset="85%" stopColor="#b30059" />
          <stop offset="100%" stopColor="#4d0026" />
        </radialGradient>
      </defs>
      <path
        d="M 20,35 C 20,35 37,21 37,13 A 7.5,7.5 0 0,0 22,8.5 L 20,11 L 18,8.5 A 7.5,7.5 0 0,0 3,13 C 3,21 20,35 20,35 Z"
        fill="url(#heartGrad)"
        stroke="#050515"
        strokeWidth="2.5"
      />
      <path
        d="M 12,11 A 3.5,3.5 0 0,1 18,12.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeOpacity="0.45"
      />
    </svg>
  );
}
