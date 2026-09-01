import React from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import clsx from 'clsx';

const LINKS = [
  { to: '/workspace', label: 'Dashboard' },
  { to: '/chat', label: 'Chat' },
  { to: '/emails', label: 'Emails' },
  { to: '/resources', label: 'Resources' },
  { to: '/graph', label: 'Graph' },
  { to: '/analytics', label: 'Analytics' },
];

export default function DashboardNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="flex flex-wrap items-center gap-1 rounded-full border border-gray-200 bg-gray-50/80 p-1 text-sm"
      aria-label="Dashboard">
      {LINKS.map(({ to, label }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            className={clsx(
              'rounded-full px-3 py-1.5 font-medium no-underline transition-colors',
              active
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800',
            )}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
