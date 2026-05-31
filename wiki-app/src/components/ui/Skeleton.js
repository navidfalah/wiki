import React from 'react';
import clsx from 'clsx';

export function Skeleton({ className, style }) {
  return (
    <div
      className={clsx(
        'animate-shimmer rounded-lg bg-shimmer-gradient bg-[length:200%_100%]',
        className,
      )}
      style={style}
    />
  );
}

export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="mb-2 h-8 w-16" />
      {lines > 1 && <Skeleton className="h-3 w-32" />}
    </div>
  );
}

export function SkeletonGrid({ count = 4, columns = 'grid-cols-2 sm:grid-cols-4' }) {
  return (
    <div className={clsx('grid gap-3 lg:gap-4', columns)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function SkeletonPage({ rows = 4 }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-panel">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            className="mb-3 h-4"
            style={{ width: `${55 + (index % 4) * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}
