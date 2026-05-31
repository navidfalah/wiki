import React from 'react';
import Link from '@docusaurus/Link';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import useGlobalData from '@docusaurus/useGlobalData';

const PLUGIN_NAME = 'docusaurus-plugin-backlinks';

export default function Backlinks() {
  const { metadata } = useDoc();
  const pluginData = useGlobalData(PLUGIN_NAME);
  const backlinks = pluginData?.backlinks?.[metadata.id] ?? [];

  if (backlinks.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 border-t border-slate-200/80 pt-8" aria-labelledby="backlinks-heading">
      <h2 id="backlinks-heading" className="mb-1 text-xl font-semibold tracking-tight text-slate-900">
        Backlinks
      </h2>
      <p className="mb-4 text-sm text-slate-500">Pages that link to this topic:</p>
      <ul className="list-inside list-disc space-y-1.5 text-slate-700">
        {backlinks.map(({ id, title, permalink }) => (
          <li key={id}>
            <Link to={permalink} className="font-medium text-emerald-600 hover:text-emerald-700">
              {title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
