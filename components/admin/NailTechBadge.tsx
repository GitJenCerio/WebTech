import React from 'react';

interface NailTechBadgeProps {
  name: string;
  role?: string;
  className?: string;
}

export default function NailTechBadge({ name, role, className = '' }: NailTechBadgeProps) {
  return (
    <div className={`d-flex align-items-center gap-2 ${className}`}>
      <span className="badge bg-secondary text-white">{name}</span>
      {role && <small className="text-muted">({role})</small>}
    </div>
  );
}
