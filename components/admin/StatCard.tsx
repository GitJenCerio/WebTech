'use client';

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/Card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: string;
  variant?: 'light' | 'dark';
  iconBgColor?: string;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtext,
  icon,
  variant = 'light',
  iconBgColor,
  className = '',
}: StatCardProps) {
  const isDark = variant === 'dark';

  if (isDark) {
    return (
      <Card
        className={`h-full min-h-[100px] border-0 shadow-md text-white ${className}`}
        style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}
      >
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <CardDescription className="text-white/70 text-sm min-h-[2.5rem] flex items-start">{title}</CardDescription>
          <div
            className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center"
            style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
          >
            <i className={`${icon} text-base text-white/80`}></i>
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-lg md:text-xl lg:text-3xl font-bold text-white">{value}</CardTitle>
          {subtext && <p className="text-xs text-white/60 mt-1">{subtext}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full min-h-[100px] border border-[#e5e5e5] shadow-card bg-gradient-to-br from-white to-[#f9f9f9] transition-shadow hover:shadow-hover ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between pb-1 p-3 md:p-6 md:pb-2">
        <CardDescription className="text-xs md:text-sm text-gray-500 min-h-[2rem] md:min-h-[2.5rem] flex items-start">{title}</CardDescription>
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBgColor ? '' : 'bg-[#f5f5f5]'}`}
          style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
        >
          <i className={`${icon} text-base text-gray-400`}></i>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        <CardTitle className="text-lg md:text-xl lg:text-3xl font-bold text-[#1a1a1a]">{value}</CardTitle>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
