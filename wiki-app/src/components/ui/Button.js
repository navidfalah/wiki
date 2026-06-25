import React from 'react';
import clsx from 'clsx';

export function PrimaryButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50',
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
        'inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}>
      {children}
    </button>
  );
}
