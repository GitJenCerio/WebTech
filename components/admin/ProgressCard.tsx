import { CardContainer } from './CardContainer';

interface ProgressCardProps {
  title: string;
  progress: number;
  subtitle?: string;
  description?: string;
}

/**
 * ProgressCard - Circular progress display card
 * Matches reference: progress card with circular indicator
 */
export function ProgressCard({ title, progress, subtitle, description }: ProgressCardProps) {
  const circumference = 2 * Math.PI * 40; // radius = 40
  const offset = circumference - (progress / 100) * circumference;

  return (
    <CardContainer className="bg-gradient-to-br from-foreground to-foreground/95 text-background border-0">
      <div className="p-5 sm:p-6">
        <h4 className="mb-4 text-base font-semibold text-background">{title}</h4>
        
        <div className="flex items-center gap-4">
          {/* Circular Progress */}
          <div className="relative h-24 w-24 shrink-0">
            <svg className="h-24 w-24 -rotate-90 transform">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="text-background transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-background">{progress}%</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {subtitle && <p className="text-sm font-medium text-background/80 mb-1">{subtitle}</p>}
            {description && <p className="text-xs text-background/60">{description}</p>}
          </div>
        </div>
      </div>
    </CardContainer>
  );
}
