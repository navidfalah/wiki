import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';

export default function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  actions,
  live = false,
}) {
  return (
    <header className="mb-8 animate-fade-in lg:mb-10">
      {breadcrumbs.length > 0 && (
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.label}>
              {index > 0 && <span aria-hidden>/</span>}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="rounded transition hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-600">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="flex items-center gap-2">
              {live && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {eyebrow}
              </p>
            </div>
          )}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-500">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className={clsx('flex shrink-0 flex-wrap gap-2')}>{actions}</div>
        )}
      </div>
    </header>
  );
}
