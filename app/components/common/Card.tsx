import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  children: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      interactive = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'bg-surface rounded-lg transition-all duration-300';

    const variantClasses = {
      default: 'border border-gray-200 dark:border-gray-700',
      elevated: 'shadow-md hover:shadow-lg',
      outlined: 'border-2 border-gray-300 dark:border-gray-600'
    } as const;

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    } as const;

    const interactiveClasses = interactive
      ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      : '';

    const classes = [
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      interactiveClasses,
      className
    ].filter(Boolean).join(' ');

    return (
      <div
        ref={ref}
        className={classes}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;