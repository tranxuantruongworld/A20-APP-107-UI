'use client';

import * as React from 'react';

export interface ToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className = '', pressed = false, onPressedChange, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const newPressed = !pressed;
      onPressedChange?.(newPressed);
      props.onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-pressed={pressed}
        {...props}
        onClick={handleClick}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-primary focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${pressed ? 'bg-primary' : 'bg-gray-300'}
          ${className}
        `}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white
            transition-transform ${pressed ? 'translate-x-5' : 'translate-x-1'}
          `}
        />
      </button>
    );
  },
);
Toggle.displayName = 'Toggle';

export { Toggle };
