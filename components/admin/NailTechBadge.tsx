import React from 'react';

/**
 * Brand-warm badge colors — still champagne / stone / earth family,
 * but distinct hues so each nail tech is easy to tell apart.
 */
const NAIL_TECH_COLORS: Array<{ bg: string; text: string; border: string }> = [
  { bg: '#efe6d8', text: '#5c4a32', border: '#c4b5a0' }, // champagne gold
  { bg: '#f0e0dc', text: '#7a3f38', border: '#d4a89e' }, // soft clay rose
  { bg: '#e4ebe3', text: '#3d5340', border: '#a8b89e' }, // soft sage
  { bg: '#ebe3ef', text: '#5c3d5a', border: '#c4a8c0' }, // dusty mauve
  { bg: '#ebe6d2', text: '#6b5a2e', border: '#c4b878' }, // warm olive
  { bg: '#e3e8ec', text: '#3d4a54', border: '#9aadb8' }, // soft slate
  { bg: '#f0e4d4', text: '#6b4528', border: '#d4b090' }, // caramel
  { bg: '#e8ddd8', text: '#5a3830', border: '#c4a090' }, // warm cocoa
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
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="inline-flex items-center justify-center rounded-none px-2 py-0.5 text-[10px] sm:text-xs font-semibold tracking-[0.06em] min-h-[20px] sm:min-h-[24px] box-border border sm:px-2.5"
        style={{ backgroundColor: bg, color: text, borderColor: border }}
      >
        {name}
      </span>
      {showRole && <small className="text-muted-foreground">({role})</small>}
    </span>
  );
}
