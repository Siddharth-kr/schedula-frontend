"use client";

import React, { useState } from "react";

export type BodyView = "front" | "back";

export interface InteractiveBodyMapProps {
  onSelectRegion: (regionId: string, view: BodyView) => void;
  selectedRegionId?: string | null;
  view: BodyView;
}

export const InteractiveBodyMap: React.FC<InteractiveBodyMapProps> = ({
  onSelectRegion,
  selectedRegionId,
  view,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getPathClass = (id: string) => {
    const isSelected = selectedRegionId === id;
    const isHovered = hoveredRegion === id;
    
    // Base styles for clean medical illustration
    let baseClass = "transition-all duration-300 cursor-pointer stroke-[1.5] ";
    
    if (isSelected) {
      baseClass += "fill-primary stroke-primary/80 scale-[1.01] transform-origin-center filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] z-10";
    } else if (isHovered) {
      baseClass += "fill-[#93C5FD] stroke-[#60A5FA] scale-[1.01] transform-origin-center z-10";
    } else {
      // Inactive: subtle blue-gray
      baseClass += "fill-[#E2E8F0] stroke-white hover:fill-[#93C5FD]";
    }
    
    return baseClass;
  };

  const handleInteract = (id: string) => {
    onSelectRegion(id, view);
  };

  const regions = [
    // Head & Neck
    { id: "head", el: <ellipse cx="100" cy="35" rx="16" ry="22" /> },
    { id: "neck", el: <path d="M 94 54 L 106 54 L 108 70 L 92 70 Z" /> },
    
    // Torso
    { 
      id: view === "front" ? "chest" : "upper_back", 
      el: <path d="M 72 70 Q 100 65 128 70 L 122 120 L 78 120 Z" /> 
    },
    { 
      id: view === "front" ? "abdomen" : "lower_back", 
      el: <path d="M 78 120 L 122 120 L 118 175 L 82 175 Z" /> 
    },
    { 
      id: "pelvis", 
      el: <path d="M 82 175 L 118 175 L 110 215 Q 100 225 90 215 Z" /> 
    },

    // Arms (Screen Left)
    { 
      id: view === "front" ? "right_arm" : "left_arm", 
      el: <rect x="52" y="75" width="16" height="55" rx="8" transform="rotate(18 60 75)" /> 
    },
    { 
      id: view === "front" ? "right_forearm" : "left_forearm", 
      el: <rect x="30" y="125" width="14" height="50" rx="7" transform="rotate(22 37 125)" /> 
    },
    { 
      id: view === "front" ? "right_hand" : "left_hand", 
      el: <circle cx="18" cy="180" r="9" /> 
    },

    // Arms (Screen Right)
    { 
      id: view === "front" ? "left_arm" : "right_arm", 
      el: <rect x="132" y="75" width="16" height="55" rx="8" transform="rotate(-18 140 75)" /> 
    },
    { 
      id: view === "front" ? "left_forearm" : "right_forearm", 
      el: <rect x="156" y="125" width="14" height="50" rx="7" transform="rotate(-22 163 125)" /> 
    },
    { 
      id: view === "front" ? "left_hand" : "right_hand", 
      el: <circle cx="182" cy="180" r="9" /> 
    },

    // Legs (Screen Left)
    { 
      id: view === "front" ? "right_thigh" : "left_thigh", 
      el: <rect x="83" y="215" width="18" height="75" rx="9" transform="rotate(3 92 215)" /> 
    },
    { 
      id: view === "front" ? "right_knee" : "left_knee", 
      el: <circle cx="89" cy="295" r="10" /> 
    },
    { 
      id: view === "front" ? "right_lower_leg" : "left_lower_leg", 
      el: <rect x="80" y="305" width="15" height="70" rx="7" transform="rotate(2 87 305)" /> 
    },
    { 
      id: view === "front" ? "right_foot" : "left_foot", 
      el: <path d={view === "front" ? "M 76 375 L 94 375 L 94 390 L 70 390 Z" : "M 76 375 L 94 375 L 94 390 L 76 390 Z"} /> 
    },

    // Legs (Screen Right)
    { 
      id: view === "front" ? "left_thigh" : "right_thigh", 
      el: <rect x="99" y="215" width="18" height="75" rx="9" transform="rotate(-3 108 215)" /> 
    },
    { 
      id: view === "front" ? "left_knee" : "right_knee", 
      el: <circle cx="111" cy="295" r="10" /> 
    },
    { 
      id: view === "front" ? "left_lower_leg" : "right_lower_leg", 
      el: <rect x="105" y="305" width="15" height="70" rx="7" transform="rotate(-2 112 305)" /> 
    },
    { 
      id: view === "front" ? "left_foot" : "right_foot", 
      el: <path d={view === "front" ? "M 106 375 L 124 375 L 130 390 L 106 390 Z" : "M 106 375 L 124 375 L 124 390 L 106 390 Z"} /> 
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden group">
      
      {/* Centered large SVG that fills its container, preserving aspect ratio natively */}
      <svg 
        viewBox="-10 -10 220 420" 
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-h-full drop-shadow-sm z-10 p-2"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft, neutral backdrop to tie the body parts together instead of a black shape */}
        <path 
          d="M 100 10 Q 60 10 50 80 Q 20 120 10 180 Q 40 220 80 200 Q 70 300 70 390 L 130 390 Q 130 300 120 200 Q 160 220 190 180 Q 180 120 150 80 Q 140 10 100 10 Z" 
          className="fill-[#F8FAFC] pointer-events-none stroke-slate-200 stroke-[1]" 
        />

        {regions.map((region) => (
          <g
            key={region.id}
            id={region.id}
            className={getPathClass(region.id)}
            onClick={() => handleInteract(region.id)}
            onMouseEnter={() => setHoveredRegion(region.id)}
            onMouseLeave={() => setHoveredRegion(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleInteract(region.id);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Select ${region.id.replace("_", " ")}`}
            style={{ transformOrigin: "100px 200px" }}
          >
            {region.el}
            {/* White dot inside selected region to mimic medical UI aesthetic */}
            {selectedRegionId === region.id && (
              <circle cx="100" cy="100" r="3" className="fill-white" opacity="0.6" transform="scale(0)" />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};
