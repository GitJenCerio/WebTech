import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ className = '', error = false, ...props }: InputProps) {
  const stateStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
    : 'border-gray-300 focus:border-black focus:ring-black/20';

  return (
    <input
      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 ${stateStyles} ${className}`}
      {...props}
    />
  );
}
