import React from 'react';
import clsx from 'clsx';

export default function PageShell({ children, className, wide = false }) {
  return (
    <main className="min-h-[calc(100vh-60px)] bg-gradient-to-b from-slate-50 via-white to-emerald-50/20">
      <div
        className={clsx(
          'mx-auto px-4 py-10 sm:px-6 lg:px-8',
          wide ? 'max-w-[1600px]' : 'max-w-7xl',
          className,
        )}>
        {children}
      </div>
    </main>
  );
}

export function Panel({ children, className, padding = true }) {
  return (
    <section
      className={clsx(
        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-panel animate-fade-in',
        padding && 'p-6 sm:p-7',
        className,
      )}>
      {children}
    </section>
  );
}

export function SectionLabel({ children, className }) {
  return (
    <p
      className={clsx(
        'text-[11px] font-semibold uppercase tracking-wider text-slate-400',
        className,
      )}>
      {children}
    </p>
  );
}
