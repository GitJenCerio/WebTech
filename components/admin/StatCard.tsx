'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/Card";

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
    <Card 
      className={`hover:shadow-lg transition-shadow ${isDark ? 'bg-gradient-to-br from-[#212529] to-[#000000] text-white' : ''} ${className}`}
    >
      <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-[#212529]'}`}>
              {title}
            </p>
            <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-[#212529]'}`}>
              {value}
            </p>
            {subtext && (
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {subtext}
              </p>
            )}
          </div>
          <div 
            className={`
              flex items-center justify-center w-12 h-12 rounded-2xl
              ${isDark ? 'bg-white bg-opacity-10' : 'bg-gray-100'}
            `}
          >
            <i className={`${icon} text-xl ${isDark ? 'text-white' : 'text-[#212529]'}`}></i>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
