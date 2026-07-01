import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer",
            {
              // Variant mappings
              "bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 focus-visible:ring-primary":
                variant === "primary",
              "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary":
                variant === "secondary",
              "border border-border bg-card text-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-primary":
                variant === "outline",
              "text-foreground hover:bg-secondary focus-visible:ring-primary": variant === "ghost",
              "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive":
                variant === "destructive",
              "text-primary hover:underline hover:bg-transparent underline-offset-4 focus-visible:ring-primary active:scale-100":
                variant === "link",

              // Size mappings
              "px-3 py-1.5 text-xs": size === "sm",
              "px-4 py-2.5 text-sm": size === "md",
              "px-6 py-3.5 text-base": size === "lg",
              "h-10 w-10 p-0": size === "icon",
            }
          ),
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
