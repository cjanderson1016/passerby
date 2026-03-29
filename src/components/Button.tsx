/*
  File Name: Button.tsx

  Description: Reusable Button component with variant, size, and state props.
  Replaces ad-hoc button styles scattered across feature files.

  Author(s): Bryson Toubassi
*/

import React from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  'aria-label'?: string;
}

export default function Button({
  variant = 'secondary',
  size,
  disabled = false,
  onClick,
  type = 'button',
  children,
  className,
  fullWidth = false,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size ? `btn--${size}` : '',
    fullWidth ? 'btn--full' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
