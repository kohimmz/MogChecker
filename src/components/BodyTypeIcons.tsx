import React from 'react';

interface BodyIconProps {
  className?: string;
  selected?: boolean;
}

export const EctomorphIcon: React.FC<BodyIconProps> = ({ className = "w-20 h-28", selected = false }) => (
  <svg viewBox="0 0 100 140" className={className} fill="none" stroke="currentColor">
    {/* Minimalist Lean Silhouette */}
    <ellipse cx="50" cy="22" rx="10" ry="13" strokeWidth="2.5" className={selected ? "stroke-white" : "stroke-zinc-400"} />
    <path
      d="M36 40 C 42 42, 58 42, 64 40 L 61 75 C 60 85, 59 90, 58 98 L 62 135 M 42 98 L 38 135 M 39 75 C 40 85, 41 90, 42 98 M 36 40 L 32 78 M 64 40 L 68 78"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={selected ? "stroke-white" : "stroke-zinc-400"}
    />
    {/* Subtle rib / lean indicator lines */}
    <line x1="45" y1="58" x2="55" y2="58" strokeWidth="1.5" strokeOpacity="0.4" className={selected ? "stroke-white" : "stroke-zinc-500"} />
    <line x1="46" y1="65" x2="54" y2="65" strokeWidth="1.5" strokeOpacity="0.4" className={selected ? "stroke-white" : "stroke-zinc-500"} />
  </svg>
);

export const MesomorphIcon: React.FC<BodyIconProps> = ({ className = "w-20 h-28", selected = false }) => (
  <svg viewBox="0 0 100 140" className={className} fill="none" stroke="currentColor">
    {/* Minimalist Athletic V-Taper Silhouette */}
    <ellipse cx="50" cy="20" rx="10.5" ry="13" strokeWidth="2.5" className={selected ? "stroke-white" : "stroke-zinc-400"} />
    {/* Broad shoulders down to narrow waist V-shape */}
    <path
      d="M26 38 C 38 41, 62 41, 74 38 L 60 76 C 58 84, 57 88, 56 96 L 64 135 M 44 96 L 36 135 M 40 76 C 42 84, 43 88, 44 96 M 26 38 L 22 75 M 74 38 L 78 75"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={selected ? "stroke-white" : "stroke-zinc-400"}
    />
    {/* Chest & Abs lines */}
    <path d="M38 52 C 45 56, 50 56, 50 52 C 50 56, 55 56, 62 52" strokeWidth="1.8" strokeLinecap="round" className={selected ? "stroke-white" : "stroke-zinc-500"} />
    <line x1="50" y1="53" x2="50" y2="76" strokeWidth="1.5" strokeOpacity="0.6" className={selected ? "stroke-white" : "stroke-zinc-500"} />
    <line x1="45" y1="64" x2="55" y2="64" strokeWidth="1.5" strokeOpacity="0.5" className={selected ? "stroke-white" : "stroke-zinc-500"} />
    <line x1="46" y1="72" x2="54" y2="72" strokeWidth="1.5" strokeOpacity="0.5" className={selected ? "stroke-white" : "stroke-zinc-500"} />
  </svg>
);

export const AverageIcon: React.FC<BodyIconProps> = ({ className = "w-20 h-28", selected = false }) => (
  <svg viewBox="0 0 100 140" className={className} fill="none" stroke="currentColor">
    {/* Minimalist Normal/Average Silhouette */}
    <ellipse cx="50" cy="22" rx="10.5" ry="13" strokeWidth="2.5" className={selected ? "stroke-white" : "stroke-zinc-400"} />
    <path
      d="M32 40 C 40 42, 60 42, 68 40 L 63 76 C 62 84, 60 90, 58 98 L 62 135 M 42 98 L 38 135 M 37 76 C 38 84, 40 90, 42 98 M 32 40 L 28 77 M 68 40 L 72 77"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={selected ? "stroke-white" : "stroke-zinc-400"}
    />
    {/* Balanced chest outline */}
    <path d="M42 54 C 47 56, 53 56, 58 54" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" className={selected ? "stroke-white" : "stroke-zinc-500"} />
  </svg>
);

export const EndomorphIcon: React.FC<BodyIconProps> = ({ className = "w-20 h-28", selected = false }) => (
  <svg viewBox="0 0 100 140" className={className} fill="none" stroke="currentColor">
    {/* Minimalist Heavy/Bulky Silhouette */}
    <ellipse cx="50" cy="22" rx="11" ry="13.5" strokeWidth="2.5" className={selected ? "stroke-white" : "stroke-zinc-400"} />
    <path
      d="M28 42 C 38 44, 62 44, 72 42 L 68 78 C 67 87, 65 92, 62 99 L 66 135 M 38 99 L 34 135 M 32 78 C 33 87, 35 92, 38 99 M 28 42 L 23 78 M 72 42 L 77 78"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={selected ? "stroke-white" : "stroke-zinc-400"}
    />
    {/* Broad waist and chest curves */}
    <path d="M38 56 C 45 60, 55 60, 62 56" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.6" className={selected ? "stroke-white" : "stroke-zinc-500"} />
    <path d="M36 74 C 44 80, 56 80, 64 74" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.5" className={selected ? "stroke-white" : "stroke-zinc-500"} />
  </svg>
);
