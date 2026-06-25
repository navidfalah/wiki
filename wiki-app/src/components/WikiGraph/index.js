import React, { useCallback, useEffect, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';

function GraphCanvas() {
  const graphUrl = useBaseUrl('/graph.json');
  const containerRef = useRef(null);
  const [ForceGraph2D, setForceGraph2D] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });

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
          throw new Error(`Failed to load graph (${response.status})`);
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
        height: Math.max(Math.floor(height), 400),
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (loading || !graphData || !ForceGraph2D) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-gray-500">
        Loading graph…
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No topics yet. Run the compiler, then rebuild the site.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-2 text-sm text-gray-600">
        {graphData.nodes.length} topics · {graphData.links?.length ?? 0} links
      </div>
      <div ref={containerRef} className="min-h-[480px] w-full">
        <ForceGraph2D
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel="name"
          nodeAutoColorBy="id"
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          onNodeClick={handleNodeClick}
          cooldownTicks={120}
        />
      </div>
    </div>
  );
}

export default function WikiGraph() {
  return (
    <BrowserOnly
      fallback={
        <div className="min-h-[400px] rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Loading graph…
        </div>
      }>
      {() => <GraphCanvas />}
    </BrowserOnly>
  );
}
