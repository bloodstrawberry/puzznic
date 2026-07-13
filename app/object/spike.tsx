import React from "react";

interface SpikeProps {
  direction: "up" | "down" | "left" | "right";
}

export default function Spike({ direction }: SpikeProps) {
  // Rotate the group based on direction around center (20, 20)
  const rotation = {
    up: "rotate(0 20 20)",
    down: "rotate(180 20 20)",
    left: "rotate(-90 20 20)",
    right: "rotate(90 20 20)",
  }[direction];

  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="spikeBaseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="50%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        <linearGradient id="spikeLightGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="spikeDarkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="tipGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      <g transform={rotation}>
        {/* Base Plate */}
        <rect
          x="3"
          y="14"
          width="34"
          height="23"
          rx="1"
          fill="url(#spikeBaseGrad)"
          stroke="#111827"
          strokeWidth="2"
        />

        {/* Hazard/Warning Stripe on the base */}
        <line x1="5" y1="18" x2="35" y2="18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="5" y1="18" x2="35" y2="18" stroke="#facc15" strokeWidth="2.5" strokeDasharray="4,4" strokeLinecap="round" />

        {/* 3D Spikes pointing UP */}
        {/* Spike 1 (Left) */}
        {/* Left face */}
        <path d="M 5 14 L 10 2 L 10 14 Z" fill="url(#spikeLightGrad)" />
        {/* Right face */}
        <path d="M 10 14 L 10 2 L 15 14 Z" fill="url(#spikeDarkGrad)" />
        {/* Red tip glow */}
        <path d="M 8 7 L 10 2 L 12 7 Z" fill="url(#tipGrad)" />

        {/* Spike 2 (Middle) */}
        <path d="M 15 14 L 20 2 L 20 14 Z" fill="url(#spikeLightGrad)" />
        <path d="M 20 14 L 20 2 L 25 14 Z" fill="url(#spikeDarkGrad)" />
        <path d="M 18 7 L 20 2 L 22 7 Z" fill="url(#tipGrad)" />

        {/* Spike 3 (Right) */}
        <path d="M 25 14 L 30 2 L 30 14 Z" fill="url(#spikeLightGrad)" />
        <path d="M 30 14 L 30 2 L 35 14 Z" fill="url(#spikeDarkGrad)" />
        <path d="M 28 7 L 30 2 L 32 7 Z" fill="url(#tipGrad)" />

        {/* Shadow under the spikes on base */}
        <rect x="4" y="14" width="32" height="2" fill="#111827" fillOpacity="0.4" />
      </g>
    </svg>
  );
}
