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
        className={`h-full min-h-[100px] border-0 shadow-md text-pearl ${className}`}
        style={{ background: 'linear-gradient(135deg, #2a2522 0%, #1c1917 50%, #3d342c 100%)' }}
      >
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <CardDescription className="text-pearl/70 text-sm min-h-[2.5rem] flex items-start">{title}</CardDescription>
          <div
            className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center"
            style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
          >
            <i className={`${icon} text-base text-pearl/80`}></i>
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-lg md:text-xl lg:text-3xl font-heading font-medium text-pearl">{value}</CardTitle>
          {subtext && <p className="text-xs text-pearl/60 mt-1">{subtext}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full min-h-[100px] border border-border shadow-card bg-gradient-to-br from-pearl to-ash-soft transition-shadow hover:shadow-hover ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between pb-1 p-3 md:p-6 md:pb-2">
        <CardDescription className="text-xs md:text-sm text-muted-foreground min-h-[2rem] md:min-h-[2.5rem] flex items-start">{title}</CardDescription>
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBgColor ? '' : 'bg-ash'}`}
          style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
        >
          <i className={`${icon} text-base text-champagne`}></i>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        <CardTitle className="text-lg md:text-xl lg:text-3xl font-heading font-medium text-ink">{value}</CardTitle>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
