'use client';

import * as React from 'react';
import { cn } from './Utils';

const OptionCardSelectedContext = React.createContext<boolean>(false);

export interface OptionCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether this option is selected (black background, white text) */
  selected?: boolean;
  /** Optional right-side content (e.g. badge) */
  right?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Selectable option card for dialogs. Use for "pick one" flows (client type, service, nail tech).
 * - Unselected: white bg, gray border, hover:border-black
 * - Selected: black bg, white text
 */
const OptionCard = React.forwardRef<HTMLButtonElement, OptionCardProps>(
  ({ className, selected = false, right, children, ...props }, ref) => {
    return (
      <OptionCardSelectedContext.Provider value={selected}>
        <button
          type="button"
          ref={ref}
          className={cn(
            'w-full text-left rounded-lg border-2 p-4 transition-all active:scale-[0.98] touch-manipulation',
            selected
              ? 'border-black bg-black text-white'
              : 'border-gray-300 bg-white text-gray-900 hover:border-gray-500 focus-visible:border-[#212529]',
            className
          )}
          aria-pressed={selected}
          {...props}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">{children}</div>
            {right != null ? <div className="flex-shrink-0">{right}</div> : null}
          </div>
        </button>
      </OptionCardSelectedContext.Provider>
    );
  }
);
OptionCard.displayName = 'OptionCard';

/** Title inside OptionCard. */
function OptionCardTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('font-semibold text-base', className)} {...props} />;
}

/** Description text. Uses context when used inside OptionCard. */
function OptionCardDescription({
  className,
  selected: selectedProp,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { selected?: boolean }) {
  const fromContext = React.useContext(OptionCardSelectedContext);
  const selected = selectedProp ?? fromContext;
  return (
    <p
      className={cn(
        'text-xs sm:text-sm opacity-75 mt-1',
        selected ? 'text-white/75' : 'text-gray-600',
        className
      )}
      {...props}
    />
  );
}

/** Small badge for the right slot (e.g. "1 slot"). Uses context when inside OptionCard. */
function OptionCardBadge({
  className,
  selected: selectedProp,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { selected?: boolean }) {
  const fromContext = React.useContext(OptionCardSelectedContext);
  const selected = selectedProp ?? fromContext;
  return (
    <span
      className={cn(
        'whitespace-nowrap text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full border',
        selected
          ? 'bg-white/20 border-white/30 text-white'
          : 'bg-gray-100 border-gray-300 text-gray-700',
        className
      )}
      {...props}
    />
  );
}

/** Extra line (e.g. discount). Uses context for selected styling. */
function OptionCardExtra({
  className,
  selected: selectedProp,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { selected?: boolean }) {
  const fromContext = React.useContext(OptionCardSelectedContext);
  const selected = selectedProp ?? fromContext;
  return (
    <p
      className={cn(
        'text-xs sm:text-sm font-semibold mt-2',
        selected ? 'text-green-300' : 'text-green-700',
        className
      )}
      {...props}
    />
  );
}

export { OptionCard, OptionCardTitle, OptionCardDescription, OptionCardBadge, OptionCardExtra };
