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
    <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Dashboard">
      {LINKS.map(({ to, label }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            className={clsx(
              'border-b-2 pb-0.5 transition-colors',
              active
                ? 'border-gray-900 font-medium text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            )}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
