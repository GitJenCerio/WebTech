'use client';

import * as React from 'react';
import { cn } from './Utils';

const OptionCardSelectedContext = React.createContext<boolean>(false);

export interface OptionCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Selectable option card for dialogs. Use for "pick one" flows (client type, service, nail tech).
 */
const OptionCard = React.forwardRef<HTMLButtonElement, OptionCardProps>(
  ({ className, selected = false, right, children, ...props }, ref) => {
    return (
      <OptionCardSelectedContext.Provider value={selected}>
        <button
          type="button"
          ref={ref}
          className={cn(
            'w-full text-left border p-4 transition-all active:scale-[0.98] touch-manipulation',
            selected
              ? 'border-[#111] bg-[#111] text-white'
              : 'border-[#e4e4e7] bg-white text-[#111] hover:border-[#a1a1aa] focus-visible:border-[#111]',
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

function OptionCardTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('font-medium text-base tracking-wide', className)} {...props} />;
}

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
        'text-xs sm:text-sm mt-1',
        selected ? 'text-white/70' : 'text-[#71717a]',
        className
      )}
      {...props}
    />
  );
}

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
        'inline-flex items-center px-2 py-0.5 text-[10px] tracking-wide uppercase border',
        selected
          ? 'border-white/30 text-white/80'
          : 'border-[#e4e4e7] text-[#71717a]',
        className
      )}
      {...props}
    />
  );
}

function OptionCardExtra({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-2', className)} {...props} />;
}

export {
  OptionCard,
  OptionCardTitle,
  OptionCardDescription,
  OptionCardBadge,
  OptionCardExtra,
};
