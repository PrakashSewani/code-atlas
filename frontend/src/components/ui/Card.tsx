import React from 'react';
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, subtitle, footer, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden transition-all hover:border-slate-700',
          className
        )}
        {...props}
      >
        {(title || subtitle) && (
          <div className="p-4 border-b border-slate-800/50">
            {title && <h3 className="text-sm font-semibold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        )}
        <div className="p-4">{children}</div>
        {footer && <div className="p-4 border-t border-slate-800/50 bg-slate-900/20">{footer}</div>}
      </div>
    );
  }
);
Card.displayName = 'Card';

export { Card };
