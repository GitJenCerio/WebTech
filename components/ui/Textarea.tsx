import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ className = '', error = false, ...props }: TextareaProps) {
  const stateStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
    : 'border-gray-300 focus:border-black focus:ring-black/20';

  return (
    <textarea
      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 ${stateStyles} ${className}`}
      {...props}
    />
  );
}
