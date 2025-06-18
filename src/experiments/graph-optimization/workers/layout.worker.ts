import {
  forceSimulation as d3ForceSimulation,
  forceLink as d3ForceLink,
  forceCollide,
  forceManyBody as d3ForceManyBody,
  forceX as d3ForceX,
  forceY as d3ForceY,
  forceZ as d3ForceZ,
  forceCenter as d3ForceCenter
} from 'd3-force-3d';

interface WorkerNode {
  id: string;
  x?: number;
  y?: number;
  z?: number;
  radius?: number;
}

interface WorkerEdge {
  id: string;
  source: string;
  target: string;
}

interface LayoutMessage {
  type: 'CALCULATE_LAYOUT';
  id: string;
  payload: {
    nodes: WorkerNode[];
    edges: WorkerEdge[];
    layoutType: string;
    dimensions?: number;
    nodeStrength?: number;
    linkDistance?: number;
  };
}

interface LayoutResponse {
  type: 'LAYOUT_COMPLETE' | 'LAYOUT_PROGRESS' | 'LAYOUT_ERROR';
  id: string;
  payload?: {
    nodes: WorkerNode[];
    progress?: number;
    duration?: number;
  };
  error?: string;
}

// Handle messages from main thread
self.addEventListener('message', (event: MessageEvent<LayoutMessage>) => {
  const { type, id, payload } = event.data;
  
  if (type === 'CALCULATE_LAYOUT') {
    try {
      const startTime = performance.now();
      const { nodes, edges, layoutType, dimensions = 3, nodeStrength = -250, linkDistance = 50 } = payload;
      
      // Create a copy of nodes to avoid mutation
      const layoutNodes = nodes.map(n => ({ ...n }));
      
      // Initialize positions if not set
      layoutNodes.forEach((node, i) => {
        if (node.x === undefined) node.x = Math.random() * 100 - 50;
        if (node.y === undefined) node.y = Math.random() * 100 - 50;
        if (node.z === undefined) node.z = dimensions === 3 ? Math.random() * 100 - 50 : 0;
      });
      
      // Create simulation based on layout type
      const simulation = createSimulation(layoutType, layoutNodes, edges, dimensions, nodeStrength, linkDistance);
      
      // Run simulation
      let progress = 0;
      const totalIterations = 300; // Default iterations
      
      // Send progress updates
      const progressInterval = setInterval(() => {
        if (progress < 100) {
          self.postMessage({
            type: 'LAYOUT_PROGRESS',
            id,
            payload: { progress, nodes: layoutNodes }
          } as LayoutResponse);
        }
      }, 100);
      
      // Run simulation synchronously
      for (let i = 0; i < totalIterations; i++) {
        simulation.tick();
        progress = Math.round((i / totalIterations) * 100);
      }
      
      clearInterval(progressInterval);
      
      const duration = performance.now() - startTime;
      
      // Send final result
      self.postMessage({
        type: 'LAYOUT_COMPLETE',
        id,
        payload: {
          nodes: layoutNodes,
          duration
        }
      } as LayoutResponse);
      
    } catch (error) {
      self.postMessage({
        type: 'LAYOUT_ERROR',
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as LayoutResponse);
    }
  }
});

function createSimulation(
  layoutType: string,
  nodes: WorkerNode[],
  edges: WorkerEdge[],
  dimensions: number,
  nodeStrength: number,
  linkDistance: number
) {
  const simulation = d3ForceSimulation(nodes as any)
    .force('center', d3ForceCenter(0, 0, 0))
    .force('charge', d3ForceManyBody().strength(nodeStrength))
    .force('collide', forceCollide((d: any) => (d.radius || 20) + 10));
  
  if (edges.length > 0) {
    simulation.force('link', d3ForceLink(edges as any)
      .id((d: any) => d.id)
      .distance(linkDistance));
  }
  
  // Add dimensional forces based on layout type
  if (layoutType === 'forceDirected2d' || dimensions === 2) {
    simulation
      .force('x', d3ForceX())
      .force('y', d3ForceY())
      .force('z', null);
  } else {
    simulation
      .force('x', d3ForceX(0).strength(0.05))
      .force('y', d3ForceY(0).strength(0.05))
      .force('z', d3ForceZ(0).strength(0.05));
  }
  
  // Stop auto-ticking
  simulation.stop();
  
  return simulation;
}

// Export for TypeScript
export {};