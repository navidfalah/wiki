import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

function TerminalLine({ line, index }) {
  const isCommand = line.startsWith('$ ');
  const isError = line.startsWith('ERROR:');

  return (
    <div
      className={clsx(
        'whitespace-pre-wrap break-words animate-fade-in',
        isCommand && 'text-emerald-400/90',
        isError && 'text-red-400',
        !isCommand && !isError && 'text-neutral-300',
      )}
      style={{ animationDelay: `${Math.min(index * 15, 120)}ms` }}>
      {line}
    </div>
  );
}

export default function BuildTerminal({ lines, status }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [lines]);

  const isEmpty = lines.length === 0;

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-neutral-800/80">
      <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" aria-hidden />
        <span className="ml-2 font-mono text-[11px] text-neutral-500">build output</span>
      </div>

      <div
        className="min-h-[300px] max-h-[440px] overflow-auto bg-neutral-950 p-4 font-mono text-[13px] leading-relaxed shadow-inner"
        ref={containerRef}
        aria-live="polite">
        {isEmpty ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 ring-1 ring-neutral-800">
              <svg
                className="h-5 w-5 text-neutral-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-500">No output yet</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-neutral-600">
              Click <span className="text-neutral-400">Run compiler</span> to stream pipeline
              logs here in real time.
            </p>
          </div>
        ) : (
          lines.map((line, index) => (
            <TerminalLine key={`${index}-${line.slice(0, 24)}`} line={line} index={index} />
          ))
        )}
        {status === 'running' && (
          <span className="inline-block animate-blink text-emerald-400">▌</span>
        )}
      </div>
    </div>
  );
}
