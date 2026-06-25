import React from 'react';
import clsx from 'clsx';

export default function PageShell({ children, className, wide = false }) {
  return (
    <main className="min-h-[calc(100vh-60px)] bg-gray-50">
      <div
        className={clsx(
          'mx-auto px-4 py-8 sm:px-6',
          wide ? 'max-w-6xl' : 'max-w-5xl',
          className,
        )}>
        {children}
      </div>
    </main>
  );
}
