import React, { useCallback, useEffect, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

function GraphCanvas() {
  const graphUrl = useBaseUrl('/graph.json');
  const containerRef = useRef(null);
  const [ForceGraph2D, setForceGraph2D] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 560 });

  useEffect(() => {
    import('react-force-graph-2d').then((mod) => {
      setForceGraph2D(() => mod.default);
    });
  }, []);

  useEffect(() => {
    fetch(graphUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load graph data (${response.status})`);
        }
        return response.json();
      })
      .then(setGraphData)
      .catch((err) => setError(err.message));
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
    return <p className={styles.message}>Could not load graph: {error}</p>;
  }

  if (!graphData || !ForceGraph2D) {
    return <p className={styles.message}>Loading graph…</p>;
  }

  if (graphData.nodes.length === 0) {
    return (
      <p className={styles.message}>
        No topics found. Run the compiler pipeline, then rebuild the site.
      </p>
    );
  }

  return (
    <div ref={containerRef} className={styles.canvas}>
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
  );
}

export default function WikiGraph() {
  return (
    <div className={styles.wrapper}>
      <BrowserOnly fallback={<p className={styles.message}>Loading graph…</p>}>
        {() => <GraphCanvas />}
      </BrowserOnly>
    </div>
  );
}
