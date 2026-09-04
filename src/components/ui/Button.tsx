import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "accent" | "outline" | "danger" | "ghost";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", isLoading, variant = "primary", children, disabled, ...props }, ref) => {
    
    let variantStyles = "";
    if (variant === "primary") {
      variantStyles = "bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md focus-visible:ring-primary";
    } else if (variant === "accent") {
      variantStyles = "bg-accent text-white hover:brightness-95 shadow-sm hover:shadow-md focus-visible:ring-accent";
    } else if (variant === "outline") {
      variantStyles = "bg-white text-primary-dark border border-border hover:bg-background shadow-sm hover:shadow-md focus-visible:ring-primary";
    } else if (variant === "danger") {
      variantStyles = "bg-error text-white hover:brightness-95 shadow-sm hover:shadow-md focus-visible:ring-error";
    } else if (variant === "ghost") {
      variantStyles = "bg-transparent text-primary-dark hover:bg-background focus-visible:ring-primary";
    }

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={`flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
