import React, { useEffect, useRef } from 'react';

export default function BuildTerminal({ lines, status }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [lines]);

  return (
    <pre
      ref={containerRef}
      className="max-h-80 min-h-[200px] overflow-auto rounded-md border border-gray-200 bg-gray-900 p-3 font-mono text-xs leading-relaxed text-gray-200"
      aria-live="polite">
      {lines.length === 0 ? (
        <span className="text-gray-500">Compiler output appears here.</span>
      ) : (
        lines.map((line, index) => (
          <span key={`${index}-${line.slice(0, 20)}`} className="block whitespace-pre-wrap">
            {line}
          </span>
        ))
      )}
      {status === 'running' && <span className="text-gray-400"> ▌</span>}
    </pre>
  );
}
