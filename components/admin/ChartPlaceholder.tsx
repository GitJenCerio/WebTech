import React from 'react';

interface ChartPlaceholderProps {
  title?: string;
  type?: 'bar' | 'line' | 'pie' | 'radar';
  height?: string;
  className?: string;
}

const iconMap = {
  bar: 'bi-bar-chart',
  line: 'bi-graph-up',
  pie: 'bi-pie-chart',
  radar: 'bi-radar',
};

export default function ChartPlaceholder({
  title,
  type = 'bar',
  height = '300px',
  className = '',
}: ChartPlaceholderProps) {
  return (
    <div className={`chart-placeholder ${className}`} style={{ minHeight: height }}>
      <i className={iconMap[type]}></i>
      {title && <p className="mt-3 mb-0">{title}</p>}
    </div>
  );
}
