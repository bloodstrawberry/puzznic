import React from "react";

function WallAutoH() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <rect x="2" y="2" width="36" height="36" fill="url(#puzznic-wallAutoGradH)" stroke="#050515" strokeWidth="2.5" />
      {/* Glow horizontal rails */}
      <line x1="2" y1="8" x2="38" y2="8" stroke="#38bdf8" strokeOpacity="0.4" strokeWidth="1.5" />
      <line x1="2" y1="32" x2="38" y2="32" stroke="#38bdf8" strokeOpacity="0.4" strokeWidth="1.5" />
      {/* Chevrons */}
      <polygon points="6,20 12,25 12,15" fill="#38bdf8" />
      <polygon points="14,20 20,25 20,15" fill="#38bdf8" />
      <polygon points="34,20 28,25 28,15" fill="#38bdf8" />
      <polygon points="26,20 20,25 20,15" fill="#38bdf8" />
    </svg>
  );
}

export default React.memo(WallAutoH);

