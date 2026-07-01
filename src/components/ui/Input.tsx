import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- LABEL COMPONENT ---
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({ children, className, required, ...props }) => {
  return (
    <label
      className={twMerge("text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block select-none", className)}
      {...props}
    >
      {children}
      {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
    </label>
  );
};

// --- INPUT COMPONENT ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, required, type = "text", ...props }, ref) => {
    return (
      <div className="w-full flex flex-col">
        {label && <Label required={required}>{label}</Label>}
        <input
          ref={ref}
          type={type}
          className={twMerge(
            clsx(
              "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
              {
                "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20": !!error,
              }
            ),
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-rose-500 mt-1 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

// --- TEXTAREA COMPONENT ---
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  required?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, required, rows = 3, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col">
        {label && <Label required={required}>{label}</Label>}
        <textarea
          ref={ref}
          rows={rows}
          className={twMerge(
            clsx(
              "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed resize-y",
              {
                "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20": !!error,
              }
            ),
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-rose-500 mt-1 font-medium">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
