import React from 'react';
import DashboardNav from '@site/src/components/ui/DashboardNav';

export default function PageHeader({ title, description }) {
  return (
    <header className="mb-8 border-b border-gray-200 pb-6">
      <DashboardNav />
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">{title}</h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{description}</p>
      )}
    </header>
  );
}
