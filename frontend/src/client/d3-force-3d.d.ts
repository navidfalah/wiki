// d3-force-3d ships no type declarations; graph.ts only uses forceCollide.
declare module 'd3-force-3d' {
  export function forceCollide(radius?: number | ((node: any) => number)): any;
}
