import React from 'react';

/** Distinct badge colors per nail tech - same tech always gets same color */
const NAIL_TECH_COLORS: Array<{ bg: string; text: string; border: string }> = [
  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },   // blue
  { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },   // emerald
  { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },   // violet
  { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },   // pink
  { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },   // amber
  { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },   // indigo
  { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' },   // teal
  { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },  // purple
];

function hashToIndex(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % NAIL_TECH_COLORS.length;
}

interface NailTechBadgeProps {
  name: string;
  role?: string;
  nailTechId?: string;
  className?: string;
}

export default function NailTechBadge({ name, role, nailTechId, className = '' }: NailTechBadgeProps) {
  const key = nailTechId ?? name;
  const index = hashToIndex(key);
  const { bg, text, border } = NAIL_TECH_COLORS[index];

  const showRole = role && role.trim() && !/^nail\s*tech$/i.test(role.trim());
  return (
    <div className={`d-flex align-items-center gap-2 ${className}`}>
      <span
        className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium min-h-[20px] sm:min-h-[24px] box-border border sm:px-2.5"
        style={{ backgroundColor: bg, color: text, borderColor: border }}
      >
        {name}
      </span>
      {showRole && <small className="text-muted">({role})</small>}
    </div>
  );
}
