import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Label } from "./Input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, required, options, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col">
        {label && <Label required={required}>{label}</Label>}
        <div className="relative">
          <select
            ref={ref}
            className={twMerge(
              clsx(
                "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer",
                {
                  "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20": !!error,
                }
              ),
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        {error && <span className="text-xs text-rose-500 mt-1 font-medium">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";
