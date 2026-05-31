import React from 'react';
import clsx from 'clsx';

export default function EmptyState({ icon, title, hint, className }) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-10 text-center',
        className,
      )}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200/60">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {hint && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">{hint}</p>
      )}
    </div>
  );
}
