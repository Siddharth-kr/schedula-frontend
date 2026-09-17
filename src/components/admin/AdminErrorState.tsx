import React from "react";

interface AdminErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function AdminErrorState({ title = "Something went wrong", message, onRetry, className = "" }: AdminErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-error/20 bg-white shadow-sm ${className}`}>
      <div className="size-12 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-sm font-bold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-500 max-w-sm">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="mt-6 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}
