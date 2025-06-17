import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-blue-600 focus:ring-primary active:bg-blue-700',
      secondary: 'bg-secondary text-white hover:bg-purple-600 focus:ring-secondary active:bg-purple-700',
      success: 'bg-success text-white hover:bg-green-600 focus:ring-success active:bg-green-700',
      warning: 'bg-warning text-white hover:bg-amber-600 focus:ring-warning active:bg-amber-700',
      error: 'bg-error text-white hover:bg-red-600 focus:ring-error active:bg-red-700',
      ghost: 'bg-transparent text-text hover:bg-surface focus:ring-gray-500 border border-gray-300 dark:border-gray-600'
    } as const;

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5'
    } as const;

    const widthClasses = fullWidth ? 'w-full' : '';

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      widthClasses,
      className
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
        )}
        {!loading && icon && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        <span className={loading ? 'opacity-0' : ''}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;