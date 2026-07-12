import React from "react";

interface ShooterProps {
  direction: "left" | "right";
  mode: "once" | "repeated";
  isPressed?: boolean;
}

export default function Shooter({ direction, mode, isPressed = false }: ShooterProps) {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="50%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="btnRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="btnGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      
      {/* Plunger/Button at the top */}
      {isPressed ? (
        <rect
          x="12"
          y="6"
          width="16"
          height="2"
          rx="0.5"
          fill={mode === "repeated" ? "url(#btnRed)" : "url(#btnGreen)"}
          stroke="#000000"
          strokeWidth="1"
        />
      ) : (
        <rect
          x="12"
          y="3"
          width="16"
          height="5"
          rx="1"
          fill={mode === "repeated" ? "url(#btnRed)" : "url(#btnGreen)"}
          stroke="#000000"
          strokeWidth="1.5"
        />
      )}
      
      {/* Button housing/base */}
      <rect
        x="10"
        y="7"
        width="20"
        height="1.5"
        fill="#374151"
        stroke="#000000"
        strokeWidth="0.5"
      />
      
      {/* Main Block Body */}
      <rect
        x="4"
        y="8"
        width="32"
        height="28"
        rx="3"
        fill="url(#metalGrad)"
        stroke="#111827"
        strokeWidth="2"
      />
      
      {/* Inner highlights (Bevel) */}
      <line x1="5" y1="9" x2="35" y2="9" stroke="#9ca3af" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="5" y1="9" x2="5" y2="35" stroke="#9ca3af" strokeWidth="1" strokeOpacity="0.4" />
      
      {/* Rivets in corners */}
      <circle cx="8" cy="12" r="1" fill="#9ca3af" fillOpacity="0.6" />
      <circle cx="32" cy="12" r="1" fill="#9ca3af" fillOpacity="0.6" />
      <circle cx="8" cy="32" r="1" fill="#9ca3af" fillOpacity="0.6" />
      <circle cx="32" cy="32" r="1" fill="#9ca3af" fillOpacity="0.6" />
      
      {/* Nozzle/Barrel on left or right */}
      {direction === "left" ? (
        <g>
          {/* Left barrel */}
          <rect
            x="0"
            y="17"
            width="5"
            height="8"
            rx="1.5"
            fill="#374151"
            stroke="#111827"
            strokeWidth="1.5"
          />
          <circle cx="2" cy="21" r="1.5" fill="#111827" />
          
          {/* Arrow pointing Left */}
          {mode === "repeated" ? (
            <path
              d="M 27 21 L 13 21 M 17 17 L 13 21 L 17 25 M 22 17 L 18 21 L 22 25"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M 25 21 L 15 21 M 19 17 L 15 21 L 19 25"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
      ) : (
        <g>
          {/* Right barrel */}
          <rect
            x="35"
            y="17"
            width="5"
            height="8"
            rx="1.5"
            fill="#374151"
            stroke="#111827"
            strokeWidth="1.5"
          />
          <circle cx="38" cy="21" r="1.5" fill="#111827" />
          
          {/* Arrow pointing Right */}
          {mode === "repeated" ? (
            <path
              d="M 13 21 L 27 21 M 23 17 L 27 21 L 23 25 M 18 17 L 22 21 L 18 25"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M 15 21 L 25 21 M 21 17 L 25 21 L 21 25"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
      )}
    </svg>
  );
}
