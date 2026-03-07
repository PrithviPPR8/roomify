import React from 'react';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: string;
  size?: string;
  fullWidth?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ...props
}) => {
  const classes = `btn btn--${variant} btn--${size}${fullWidth ? ' btn--fullWidth' : ''}${className ? ` ${className}` : ''}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
