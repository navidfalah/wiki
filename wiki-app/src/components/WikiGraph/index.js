import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import EmptyState from '@site/src/components/ui/EmptyState';
import { Skeleton } from '@site/src/components/ui/Skeleton';

function GraphSkeleton() {
  return (
    <div className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-panel">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center bg-slate-50/50 p-8">
        <div className="absolute inset-0 opacity-40">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                top: `${15 + (index * 7) % 70}%`,
                left: `${10 + (index * 11) % 80}%`,
              }}>
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
          ))}
        </div>
        <p className="relative text-sm text-slate-400">Loading graph…</p>
      </div>
    </div>
  );
}

function GraphCanvas() {
  const graphUrl = useBaseUrl('/graph.json');
  const containerRef = useRef(null);
  const [ForceGraph2D, setForceGraph2D] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 560 });

  useEffect(() => {
    import('react-force-graph-2d').then((mod) => {
      setForceGraph2D(() => mod.default);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(graphUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load graph data (${response.status})`);
        }
        return response.json();
      })
      .then(setGraphData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [graphUrl]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(Math.floor(width), 320),
        height: Math.max(Math.floor(height), 480),
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleNodeClick = useCallback((node) => {
    if (node.path) {
      window.location.assign(node.path);
    }
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200/80 bg-red-50 px-6 py-8 shadow-card">
        <EmptyState
          title="Could not load graph"
          hint={error}
          icon={
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
      </div>
    );
  }

  if (loading || !graphData || !ForceGraph2D) {
    return <GraphSkeleton />;
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white px-6 py-12 shadow-panel">
        <EmptyState
          title="No topics found"
          hint="Run the compiler pipeline, then rebuild the site to populate the graph."
          icon={
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <p className="text-sm text-slate-500">
          <span className="font-semibold tabular-nums text-slate-800">{graphData.nodes.length}</span>{' '}
          topics ·{' '}
          <span className="font-semibold tabular-nums text-slate-800">{graphData.links?.length ?? 0}</span>{' '}
          links
        </p>
        <p className="text-xs text-slate-400">Click a node to open that topic</p>
      </div>
      <div
        ref={containerRef}
        className={clsx('w-full min-h-[560px] bg-slate-50/30')}>
        <ForceGraph2D
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel="name"
          nodeAutoColorBy="id"
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.15}
          onNodeClick={handleNodeClick}
          cooldownTicks={120}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </div>
    </div>
  );
}

export default function WikiGraph() {
  return (
    <div className="flex min-h-[560px] flex-1 flex-col">
      <BrowserOnly fallback={<GraphSkeleton />}>
        {() => <GraphCanvas />}
      </BrowserOnly>
    </div>
  );
}
