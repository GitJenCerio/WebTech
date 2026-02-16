import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from "@/components/ui/Card";

interface CardContainerProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

/**
 * CardContainer - Shared card style matching reference using shadcn/ui Card
 * - White background
 * - Soft shadow
 * - Rounded corners (2xl/3xl)
 * - Subtle border
 * - Optional hover lift effect
 */
export function CardContainer({ children, className, hover = true }: CardContainerProps) {
  return (
    <Card
      className={cn(
        'rounded-3xl border border-gray-300 bg-white shadow-[0_6px_20px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.06)] transition-all duration-300',
        hover && 'hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.12),0_3px_8px_rgba(0,0,0,0.08)]',
        className
      )}
    >
      {children}
    </Card>
  );
}
