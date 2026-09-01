import React, { useState } from 'react';
import DashboardNav from '@site/src/components/ui/DashboardNav';
import { IconButton } from '@site/src/components/ui/Button';
import { SettingsIcon } from '@site/src/components/ui/Icons';
import SettingsPanel from '@site/src/components/SettingsPanel';

export default function PageHeader({ title, description }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="mb-8 border-b border-gray-100 pb-6">
      <div className="flex items-center justify-between gap-4">
        <DashboardNav />
        <IconButton
          label="Settings"
          onClick={() => setSettingsOpen(true)}
          className="shrink-0 border border-gray-200">
          <SettingsIcon size={17} />
        </IconButton>
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{description}</p>
      )}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
