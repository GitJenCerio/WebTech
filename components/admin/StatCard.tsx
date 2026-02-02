import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: string;
  iconBgColor?: string;
  darkBackground?: boolean;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtext,
  icon,
  iconBgColor = '#e9ecef',
  darkBackground = false,
  className = '',
}: StatCardProps) {
  return (
    <div className={`card stat-card ${darkBackground ? 'dark-bg' : ''} ${className}`}>
      <div className="card-body">
        <div
          className="stat-card-icon"
          style={{ backgroundColor: darkBackground ? 'rgba(255, 255, 255, 0.15)' : iconBgColor, color: darkBackground ? '#ffffff' : 'inherit' }}
        >
          <i className={icon}></i>
        </div>
        <div className="stat-card-label">{title}</div>
        <div className="stat-card-value">{value}</div>
        {subtext && (
          <div className="stat-card-subtext text-muted small mt-1">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
