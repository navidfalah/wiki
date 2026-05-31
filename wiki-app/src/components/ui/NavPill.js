import React from 'react';
import Link from '@docusaurus/Link';

export default function NavPill({ to, label, description }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
      <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900">
        {label}
      </span>
      {description && (
        <span className="hidden text-xs text-slate-400 sm:inline">{description}</span>
      )}
    </Link>
  );
}
