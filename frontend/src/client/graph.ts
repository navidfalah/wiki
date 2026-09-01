import ForceGraph, { NodeObject, LinkObject } from 'force-graph';
import { forceCollide } from 'd3-force-3d';

declare global {
  interface Window {
    showToast?: (message: string, type?: string) => void;
  }
}

const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

interface Topic {
  id: string;
  title: string;
  filename: string;
}

interface EffectiveLink {
  source_id: string;
  target_id: string;
  source_topic: string;
  target_topic: string;
  origin: 'detected' | 'override';
}

interface GraphNode extends NodeObject {
  id: string;
  name: string;
  filename: string;
  degree: number;
  neighborIds: Set<string>;
}

interface GraphLink extends LinkObject {
  origin: 'detected' | 'override';
}

const container = document.getElementById('graph-canvas')!;
const emptyEl = document.getElementById('graph-empty')!;
const searchInput = document.getElementById('graph-search') as HTMLInputElement;
const fitButton = document.getElementById('graph-fit')!;
const selectMatchesButton = document.getElementById('graph-select-matches') as HTMLButtonElement;
const statsEl = document.getElementById('graph-stats')!;
const hubsEl = document.getElementById('graph-hubs')!;
const inspectorEl = document.getElementById('graph-inspector')!;
const selectionBar = document.getElementById('graph-selection-bar')!;
const selectionCountEl = document.getElementById('graph-selection-count')!;
const selectionChipsEl = document.getElementById('graph-selection-chips')!;
const selectionClearBtn = document.getElementById('graph-selection-clear')!;
const selectionExportBtn = document.getElementById('graph-selection-export') as HTMLButtonElement;
const selectionExportLabel = document.getElementById('graph-selection-export-label')!;

let graph: ReturnType<typeof ForceGraph<GraphNode, GraphLink>> | null = null;
let allNodes: GraphNode[] = [];
let allLinks: GraphLink[] = [];
let matchedIds = new Set<string>();
let selectedIds = new Set<string>();
let hoverNode: GraphNode | null = null;
let maxDegree = 1;

// A muted-to-hot ramp: quiet leaves fade toward indigo, then amber/red as a
// topic accumulates more links, so a hub is visible before you even count
// its edges.
const RAMP: [number, number, number][] = [
  [199, 210, 254], // generated-border (few links)
  [79, 70, 229], // generated (well connected)
  [180, 83, 9], // source (hub)
  [220, 38, 38], // red-600 (super-hub)
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rampColor(t: number): string {
  t = Math.max(0, Math.min(1, t));
  const segs = RAMP.length - 1;
  const scaled = t * segs;
  const i = Math.min(segs - 1, Math.floor(scaled));
  const localT = scaled - i;
  const [r1, g1, b1] = RAMP[i];
  const [r2, g2, b2] = RAMP[i + 1];
  const r = Math.round(lerp(r1, r2, localT));
  const g = Math.round(lerp(g1, g2, localT));
  const b = Math.round(lerp(b1, b2, localT));
  return `rgb(${r}, ${g}, ${b})`;
}

function degreeT(node: GraphNode): number {
  if (maxDegree <= 1) return 0;
  return Math.log1p(node.degree) / Math.log1p(maxDegree);
}

function nodeRadius(node: GraphNode): number {
  return 3.2 + Math.sqrt(node.degree) * 1.9;
}

function nodeColor(node: GraphNode): string {
  if (matchedIds.size > 0) {
    if (matchedIds.has(node.id)) return '#f97316';
    if (hoverNode && hoverNode.neighborIds.has(node.id)) return rampColor(degreeT(node));
    return '#e5e7eb';
  }
  if (hoverNode) {
    if (node.id === hoverNode.id) return '#f97316';
    if (hoverNode.neighborIds.has(node.id)) return rampColor(Math.max(0.55, degreeT(node)));
    return '#e5e7eb';
  }
  return rampColor(degreeT(node));
}

function toggleSelection(node: GraphNode) {
  if (selectedIds.has(node.id)) selectedIds.delete(node.id);
  else selectedIds.add(node.id);
  renderSelectionBar();
  graph?.nodeCanvasObject(graph.nodeCanvasObject());
}

function clearSelection() {
  selectedIds.clear();
  renderSelectionBar();
  graph?.nodeCanvasObject(graph.nodeCanvasObject());
}

function renderSelectionBar() {
  if (!selectedIds.size) {
    selectionBar.classList.add('hidden');
    selectionBar.classList.remove('flex');
    return;
  }
  selectionBar.classList.remove('hidden');
  selectionBar.classList.add('flex');
  const nodes = allNodes.filter((n) => selectedIds.has(n.id));
  selectionCountEl.textContent = `${nodes.length} selected`;
  selectionExportLabel.textContent = `Export ${nodes.length} file${nodes.length === 1 ? '' : 's'}`;
  selectionChipsEl.innerHTML = nodes
    .slice(0, 24)
    .map(
      (n) => `
    <span data-chip="${escapeHtml(n.id)}" class="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200">
      ${escapeHtml(n.name)}
      <button data-remove="${escapeHtml(n.id)}" aria-label="Remove ${escapeHtml(n.name)} from selection" class="text-gray-400 hover:text-gray-700">×</button>
    </span>`,
    )
    .join('');
  if (nodes.length > 24) {
    selectionChipsEl.innerHTML += `<span class="text-xs text-gray-400">+ ${nodes.length - 24} more</span>`;
  }
  selectionChipsEl.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      selectedIds.delete(btn.dataset.remove!);
      renderSelectionBar();
      graph?.nodeCanvasObject(graph.nodeCanvasObject());
    });
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function exportSelected() {
  const nodes = allNodes.filter((n) => selectedIds.has(n.id));
  if (!nodes.length) return;
  selectionExportBtn.disabled = true;
  const originalLabel = selectionExportLabel.textContent;
  try {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      selectionExportLabel.textContent = `Exporting ${i + 1}/${nodes.length}…`;
      const res = await fetch(`${apiBase}/api/docs/${node.filename}`);
      if (!res.ok) continue;
      const doc = await res.json();
      const blob = new Blob([doc.body ?? ''], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${node.filename.replace(/\.md$/, '')}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (i < nodes.length - 1) await delay(180);
    }
    window.showToast?.(`Exported ${nodes.length} file${nodes.length === 1 ? '' : 's'}`, 'success');
  } catch (err) {
    window.showToast?.('Export failed.', 'error');
  } finally {
    selectionExportBtn.disabled = false;
    selectionExportLabel.textContent = originalLabel;
  }
}

function linkEndpointIds(link: any): [string, string] {
  const src = typeof link.source === 'object' ? link.source.id : link.source;
  const tgt = typeof link.target === 'object' ? link.target.id : link.target;
  return [src, tgt];
}

function linkTouchesHover(link: any): boolean {
  if (!hoverNode) return false;
  const [src, tgt] = linkEndpointIds(link);
  return src === hoverNode.id || tgt === hoverNode.id;
}

function linkColor(link: any): string {
  const isOverride = link.origin === 'override';
  if (matchedIds.size > 0) {
    const [src, tgt] = linkEndpointIds(link);
    const touches = matchedIds.has(src) || matchedIds.has(tgt);
    if (!touches) return 'rgba(209,213,219,0.15)';
    return isOverride ? '#f59e0b' : 'rgba(249,115,22,0.55)';
  }
  if (hoverNode) {
    return linkTouchesHover(link) ? (isOverride ? '#f59e0b' : '#f97316') : 'rgba(209,213,219,0.1)';
  }
  return isOverride ? 'rgba(245,158,11,0.7)' : 'rgba(148,163,184,0.28)';
}

function linkWidth(link: any): number {
  const isOverride = link.origin === 'override';
  const base = isOverride ? 1.4 : 0.7;
  if (hoverNode && linkTouchesHover(link)) return base + 1.4;
  if (matchedIds.size > 0) {
    const [src, tgt] = linkEndpointIds(link);
    if (matchedIds.has(src) || matchedIds.has(tgt)) return base + 1;
  }
  return base;
}

function shouldLabel(node: GraphNode, globalScale: number, topHubIds: Set<string>): boolean {
  if (hoverNode && (node.id === hoverNode.id || hoverNode.neighborIds.has(node.id))) return true;
  if (matchedIds.size > 0 && matchedIds.has(node.id)) return true;
  if (selectedIds.has(node.id)) return true;
  if (topHubIds.has(node.id)) return true;
  return globalScale > 2.4;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderStats(nodeCount: number, linkCount: number, overrideCount: number) {
  const cards = [
    { label: 'Topics', value: String(nodeCount), tone: 'bg-generated-bg text-generated' },
    { label: 'Links', value: String(linkCount), tone: 'bg-gray-100 text-gray-600' },
    { label: 'Manual overrides', value: String(overrideCount), tone: 'bg-amber-50 text-amber-600' },
    { label: 'Most-linked topic', value: allNodes.length ? topHub()?.name ?? '—' : '—', tone: 'bg-source-bg text-source' },
  ];
  statsEl.innerHTML = cards
    .map(
      (c) => `
    <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-card">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.tone}">●</span>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold leading-tight text-gray-900" title="${escapeHtml(c.value)}">${escapeHtml(c.value)}</p>
        <p class="mt-0.5 text-xs text-gray-500">${escapeHtml(c.label)}</p>
      </div>
    </div>`,
    )
    .join('');
}

function topHub(): GraphNode | null {
  return allNodes.reduce<GraphNode | null>((best, n) => (!best || n.degree > best.degree ? n : best), null);
}

function renderHubChips() {
  const top = [...allNodes].sort((a, b) => b.degree - a.degree).slice(0, 8);
  if (!top.length) {
    hubsEl.innerHTML = '';
    return;
  }
  hubsEl.innerHTML =
    `<span class="mr-1 text-gray-400">Jump to hub:</span>` +
    top
      .map(
        (n) =>
          `<button data-hub="${escapeHtml(n.id)}" class="rounded-full border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-700 hover:border-source-border hover:bg-source-bg hover:text-source">${escapeHtml(
            n.name,
          )} <span class="text-gray-400">· ${n.degree}</span></button>`,
      )
      .join('');
  hubsEl.querySelectorAll<HTMLButtonElement>('[data-hub]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const node = allNodes.find((n) => n.id === btn.dataset.hub);
      if (node && graph) {
        graph.centerAt(node.x, node.y, 600);
        graph.zoom(3, 600);
        showInspector(node);
      }
    }),
  );
}

function showInspector(node: GraphNode) {
  const neighborTitles = allNodes.filter((n) => node.neighborIds.has(n.id)).map((n) => n.name);
  const shown = neighborTitles.slice(0, 14);
  const extra = neighborTitles.length - shown.length;
  const slug = node.filename.replace(/\.md$/, '');
  const selected = selectedIds.has(node.id);
  inspectorEl.classList.remove('hidden', 'pointer-events-none');
  inspectorEl.classList.add('pointer-events-auto');
  inspectorEl.innerHTML = `
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm font-semibold text-gray-900">${escapeHtml(node.name)}</p>
      <a href="/wiki/${encodeURIComponent(slug)}" title="Open page" class="shrink-0 text-gray-400 hover:text-accent">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      </a>
    </div>
    <p class="mt-0.5 text-xs text-gray-500">${node.degree} connection${node.degree === 1 ? '' : 's'}</p>
    <div class="mt-2 max-h-48 overflow-auto text-xs text-gray-600">
      ${
        shown.length
          ? `<ul class="space-y-0.5">${shown.map((t) => `<li class="truncate">· ${escapeHtml(t)}</li>`).join('')}</ul>${
              extra > 0 ? `<p class="mt-1 text-gray-400">+ ${extra} more</p>` : ''
            }`
          : '<p class="text-gray-400">No connections yet.</p>'
      }
    </div>
    <button id="graph-inspector-select" class="mt-3 w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
      selected
        ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/15'
        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
    }">${selected ? '✓ Selected for export' : '+ Select for export'}</button>`;

  document.getElementById('graph-inspector-select')?.addEventListener('click', () => {
    toggleSelection(node);
    showInspector(node);
  });
}

function hideInspector() {
  inspectorEl.classList.add('hidden', 'pointer-events-none');
  inspectorEl.classList.remove('pointer-events-auto');
  inspectorEl.innerHTML = '';
}

function showEmpty(message: string) {
  container.classList.add('hidden');
  emptyEl.textContent = message;
  emptyEl.classList.remove('hidden');
}

function applySearch() {
  const needle = searchInput.value.trim().toLowerCase();
  matchedIds = needle ? new Set(allNodes.filter((n) => n.name.toLowerCase().includes(needle)).map((n) => n.id)) : new Set();
  selectMatchesButton.disabled = matchedIds.size === 0;
  selectMatchesButton.textContent = matchedIds.size ? `Select matches (${matchedIds.size})` : 'Select matches';
  graph?.nodeColor(graph.nodeColor());
  graph?.linkColor(graph.linkColor());
}

async function load() {
  try {
    const res = await fetch(`${apiBase}/api/knowledge-graph`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    const topics: Topic[] = data.topics ?? [];
    const links: EffectiveLink[] = data.effective_links ?? [];

    if (!topics.length) {
      showEmpty('No topics indexed yet. Run the compiler first.');
      return;
    }

    const nodeById = new Map<string, GraphNode>();
    allNodes = topics.map((t) => {
      const node: GraphNode = { id: t.id, name: t.title, filename: t.filename, degree: 0, neighborIds: new Set() };
      nodeById.set(t.id, node);
      return node;
    });

    allLinks = links
      .filter((l) => nodeById.has(l.source_id) && nodeById.has(l.target_id))
      .map((l) => ({ source: l.source_id, target: l.target_id, origin: l.origin }));

    for (const link of allLinks) {
      const src = nodeById.get(link.source as string)!;
      const tgt = nodeById.get(link.target as string)!;
      src.degree += 1;
      tgt.degree += 1;
      src.neighborIds.add(tgt.id);
      tgt.neighborIds.add(src.id);
    }
    maxDegree = Math.max(1, ...allNodes.map((n) => n.degree));

    const topHubIds = new Set([...allNodes].sort((a, b) => b.degree - a.degree).slice(0, 15).map((n) => n.id));
    const overrideCount = allLinks.filter((l) => l.origin === 'override').length;

    renderStats(allNodes.length, allLinks.length, overrideCount);
    renderHubChips();

    graph = ForceGraph<GraphNode, GraphLink>()(container)
      .graphData({ nodes: allNodes, links: allLinks })
      .nodeId('id')
      .nodeLabel('name')
      .nodeVal((n) => nodeRadius(n))
      .nodeColor((n) => nodeColor(n))
      .nodeCanvasObjectMode(() => 'replace')
      .nodeCanvasObject((node, ctx, globalScale) => {
        const r = nodeRadius(node);
        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = nodeColor(node);
        ctx.fill();
        if (hoverNode && node.id === hoverNode.id) {
          ctx.lineWidth = 1.5 / globalScale;
          ctx.strokeStyle = '#1f2937';
          ctx.stroke();
        }
        if (selectedIds.has(node.id)) {
          ctx.lineWidth = 2.2 / globalScale;
          ctx.strokeStyle = '#059669';
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, r + 2.5 / globalScale, 0, 2 * Math.PI, false);
          ctx.stroke();
        }
        if (shouldLabel(node, globalScale, topHubIds)) {
          const fontSize = Math.max(3.2, 11 / globalScale);
          ctx.font = `${node.degree >= 10 ? '600' : '500'} ${fontSize}px Inter, system-ui, sans-serif`;
          const label = node.name;
          const textWidth = ctx.measureText(label).width;
          const pad = 1.5;
          const x = node.x ?? 0;
          const y = (node.y ?? 0) + r + fontSize * 0.9;
          ctx.fillStyle = 'rgba(255,255,255,0.82)';
          ctx.fillRect(x - textWidth / 2 - pad, y - fontSize * 0.78, textWidth + pad * 2, fontSize + pad);
          ctx.fillStyle = matchedIds.has(node.id) ? '#c2410c' : '#111827';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, x, y - fontSize * 0.28 + fontSize / 2);
        }
      })
      .nodePointerAreaPaint((node, color, ctx) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, nodeRadius(node) + 2, 0, 2 * Math.PI, false);
        ctx.fill();
      })
      .linkColor((l: any) => linkColor(l))
      .linkWidth((l: any) => linkWidth(l))
      .linkDirectionalArrowLength((l: any) => (hoverNode && linkTouchesHover(l) ? 5 : 3)
      )
      .linkDirectionalArrowRelPos(1)
      .onNodeHover((node) => {
        hoverNode = (node as GraphNode) ?? null;
        container.style.cursor = node ? 'pointer' : 'default';
        if (hoverNode) showInspector(hoverNode);
        else hideInspector();
        graph?.nodeColor(graph.nodeColor());
        graph?.linkColor(graph.linkColor());
      })
      .onNodeClick((n) => {
        toggleSelection(n as GraphNode);
        showInspector(n as GraphNode);
      })
      .cooldownTicks(260)
      .d3AlphaDecay(0.02)
      .d3VelocityDecay(0.32)
      .onEngineStop(() => graph?.zoomToFit(400, 50));

    graph.d3Force('charge')?.strength((n: GraphNode) => -60 - n.degree * 14).distanceMax(900);
    graph.d3Force('link')?.distance((l: any) => 46 + Math.min(60, ((l.source as GraphNode).degree ?? 0) * 1.2));
    graph.d3Force('collision', forceCollide((n: any) => nodeRadius(n) + 6));

    const resize = () => graph?.width(container.clientWidth).height(container.clientHeight);
    new ResizeObserver(resize).observe(container);
    resize();
  } catch (err) {
    showEmpty(`Cannot reach API at ${apiBase}.`);
  }
}

searchInput.addEventListener('input', applySearch);
fitButton.addEventListener('click', () => graph?.zoomToFit(400, 50));
selectMatchesButton.addEventListener('click', () => {
  matchedIds.forEach((id) => selectedIds.add(id));
  renderSelectionBar();
  graph?.nodeCanvasObject(graph.nodeCanvasObject());
});
selectionClearBtn.addEventListener('click', clearSelection);
selectionExportBtn.addEventListener('click', exportSelected);
load();
