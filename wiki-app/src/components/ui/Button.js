import React from 'react';
import clsx from 'clsx';

export function PrimaryButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-card transition-all duration-200 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-card transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}>
      {children}
    </button>
  );
}
