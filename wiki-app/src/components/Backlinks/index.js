import React from 'react';
import Link from '@docusaurus/Link';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import useGlobalData from '@docusaurus/useGlobalData';
import styles from './styles.module.css';

const PLUGIN_NAME = 'docusaurus-plugin-backlinks';

export default function Backlinks() {
  const { metadata } = useDoc();
  const pluginData = useGlobalData(PLUGIN_NAME);
  const backlinks = pluginData?.backlinks?.[metadata.id] ?? [];

  if (backlinks.length === 0) {
    return null;
  }

  return (
    <section className={styles.backlinks} aria-labelledby="backlinks-heading">
      <hr className={styles.divider} />
      <h2 id="backlinks-heading" className={styles.heading}>
        Backlinks
      </h2>
      <p className={styles.subtitle}>Pages that link to this topic:</p>
      <ul className={styles.list}>
        {backlinks.map(({ id, title, permalink }) => (
          <li key={id}>
            <Link to={permalink}>{title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
