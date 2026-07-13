import React from "react";

function WallAutoV() {
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      <rect x="2" y="2" width="36" height="36" fill="url(#puzznic-wallAutoGradV)" stroke="#050515" strokeWidth="2.5" />
      {/* Glow vertical rails */}
      <line x1="8" y1="2" x2="8" y2="38" stroke="#38bdf8" strokeOpacity="0.4" strokeWidth="1.5" />
      <line x1="32" y1="2" x2="32" y2="38" stroke="#38bdf8" strokeOpacity="0.4" strokeWidth="1.5" />
      {/* Chevrons */}
      <polygon points="20,6 25,12 15,12" fill="#38bdf8" />
      <polygon points="20,14 25,20 15,20" fill="#38bdf8" />
      <polygon points="20,34 25,28 15,28" fill="#38bdf8" />
      <polygon points="20,26 25,20 15,20" fill="#38bdf8" />
    </svg>
  );
}

export default React.memo(WallAutoV);

