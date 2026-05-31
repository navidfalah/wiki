import React, { useEffect, useRef } from 'react';
import styles from './styles.module.css';

export default function BuildTerminal({ lines, status }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [lines]);

  return (
    <div className={styles.terminal} ref={containerRef} aria-live="polite">
      {lines.length === 0 ? (
        <div className={styles.placeholder}>
          Compiler output will stream here when you run a build.
        </div>
      ) : (
        lines.map((line, index) => (
          <div key={`${index}-${line.slice(0, 24)}`} className={styles.line}>
            {line}
          </div>
        ))
      )}
      {status === 'running' && <div className={styles.cursor}>▌</div>}
    </div>
  );
}
