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
            'w-full rounded-none text-left border p-4 transition-all duration-300 active:scale-[0.98] touch-manipulation',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c4b5a0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffcfa]',
            'disabled:opacity-45 disabled:pointer-events-none',
            selected
              ? 'border-[#1c1917] bg-[#1c1917] text-[#fffcfa] shadow-[0_8px_24px_rgba(28,25,23,0.18)]'
              : 'border-[#e7e2db] bg-[#fffcfa] text-[#1c1917] hover:border-[#c4b5a0] hover:bg-[#faf8f6]',
            className
          )}
          aria-pressed={selected}
          {...props}
        >
          <div
            className={cn(
              'grid items-start gap-x-3 gap-y-1',
              right != null ? 'grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-1'
            )}
          >
            {children}
            {right != null ? (
              <div className="col-start-2 row-start-1 shrink-0 justify-self-end">{right}</div>
            ) : null}
          </div>
        </button>
      </OptionCardSelectedContext.Provider>
    );
  }
);
OptionCard.displayName = 'OptionCard';

function OptionCardTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('col-start-1 row-start-1 min-w-0 font-heading text-lg sm:text-xl leading-snug', className)} {...props} />
  );
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
        'col-span-full w-full text-xs sm:text-sm leading-relaxed',
        selected ? 'text-[#fffcfa]/70' : 'text-[#78716c]',
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
        'inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.16em] uppercase border whitespace-nowrap',
        selected
          ? 'border-[#c4b5a0]/50 text-[#fffcfa]/80'
          : 'border-[#e7e2db] text-[#78716c]',
        className
      )}
      {...props}
    />
  );
}

function OptionCardExtra({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('col-span-full mt-2', className)} {...props} />;
}

export {
  OptionCard,
  OptionCardTitle,
  OptionCardDescription,
  OptionCardBadge,
  OptionCardExtra,
};
