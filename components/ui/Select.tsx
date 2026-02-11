import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ className = '', error = false, children, ...props }: SelectProps) {
  const stateStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
    : 'border-gray-300 focus:border-black focus:ring-black/20';

  return (
    <select
      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 ${stateStyles} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
