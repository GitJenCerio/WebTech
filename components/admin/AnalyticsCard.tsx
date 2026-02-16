'use client';

import { ReactNode, useState } from 'react';
import { CardContainer } from './CardContainer';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import ChartPlaceholder from './ChartPlaceholder';

interface AnalyticsCardProps {
  title: string;
  value: string;
  period: string;
  periods?: string[];
  chart?: ReactNode;
}

/**
 * AnalyticsCard - Analytics card with period toggle and chart
 * Matches reference: large card with segmented toggle
 */
export function AnalyticsCard({
  title,
  value,
  period,
  periods = ['Day', 'Week', 'Month', 'Year'],
  chart,
}: AnalyticsCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  return (
    <CardContainer>
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-gray-100 hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Value */}
        <div className="mb-6">
          <p className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{value}</p>
          <p className="text-sm text-muted-foreground">{period}</p>
        </div>

        {/* Period Toggle */}
        <div className="mb-6 flex gap-2">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                selectedPeriod === p
                  ? 'bg-foreground text-background'
                  : 'bg-gray-100 text-foreground hover:bg-gray-200'
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="min-h-[200px]">
          {chart || <ChartPlaceholder type="line" height="200px" />}
        </div>
      </div>
    </CardContainer>
  );
}
