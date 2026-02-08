'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: string;
  variant?: 'light' | 'dark';
  className?: string;
}

/**
 * StatCard Component - Dashboard statistics card
 * Following monochrome luxury branding
 * Mobile-responsive with clean design
 */
export default function StatCard({
  title,
  value,
  subtext,
  icon,
  variant = 'light',
  className = '',
}: StatCardProps) {
  const isDark = variant === 'dark';
  
  return (
    <div 
      className={`
        card-brand hover:shadow-md
        ${isDark ? 'bg-black text-white' : 'bg-white text-black'}
        ${className}
      `}
    >
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-dark'}`}>
              {title}
            </p>
            <p className="text-3xl font-bold mb-1">
              {value}
            </p>
            {subtext && (
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-medium'}`}>
                {subtext}
              </p>
            )}
          </div>
          <div 
            className={`
              flex items-center justify-center w-12 h-12 rounded-sm
              ${isDark ? 'bg-white bg-opacity-10' : 'bg-gray-lightest'}
            `}
          >
            <i className={`${icon} text-xl ${isDark ? 'text-white' : 'text-black'}`}></i>
          </div>
        </div>
      </div>
    </div>
  );
}
