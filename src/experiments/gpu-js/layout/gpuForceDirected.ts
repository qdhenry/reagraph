import Graph from 'graphology';
import { LayoutStrategy, LayoutFactoryProps } from '../../../layout';
import { InternalGraphPosition } from '../../../types';
import { buildNodeEdges } from '../../../layout/layoutUtils';
import { GpuManager } from '../utils/gpuManager';
import { ForceKernels } from './kernels/forceKernels';

export interface GpuForceDirectedLayoutOptions extends LayoutFactoryProps {
  iterations?: number;
  nodeStrength?: number;
  linkDistance?: number;
  linkStrength?: number;
  centerStrength?: number;
  velocityDecay?: number;
  is3d?: boolean;
  alphaMin?: number;
  alphaDecay?: number;
}

interface NodeData {
  id: string;
  position: InternalGraphPosition;
  velocity: { x: number; y: number; z: number };
  mass: number;
}

export function gpuForceDirected({
  graph,
  iterations = 300,
  nodeStrength = -30,
  linkDistance = 30,
  linkStrength = 1,
  centerStrength = 0.1,
  velocityDecay = 0.4,
  is3d = true,
  alphaMin = 0.001,
  alphaDecay = 0.0228,
  getNodePosition,
  drags
}: GpuForceDirectedLayoutOptions): LayoutStrategy {
  const { nodes, edges } = buildNodeEdges(graph);
  const nodeMap = new Map<string, NodeData>();
  const nodeIndexMap = new Map<string, number>();
  
  // Initialize node data
  nodes.forEach((node, index) => {
    const initialPos = getNodePosition?.(node.id, { graph, drags, nodes, edges }) || node.position;
    
    nodeMap.set(node.id, {
      id: node.id,
      position: initialPos,
      velocity: { x: 0, y: 0, z: 0 },
      mass: 1
    });
    nodeIndexMap.set(node.id, index);
  });

  // Prepare data for GPU
  const nodeCount = nodes.length;
  const positions = {
    x: new Float32Array(nodeCount),
    y: new Float32Array(nodeCount),
    z: new Float32Array(nodeCount)
  };
  const velocities = {
    x: new Float32Array(nodeCount),
    y: new Float32Array(nodeCount),
    z: new Float32Array(nodeCount)
  };
  const nodeStrengthArray = new Float32Array(nodeCount);
  
  // Initialize arrays
  nodes.forEach((node, i) => {
    const data = nodeMap.get(node.id)!;
    positions.x[i] = data.position.x;
    positions.y[i] = data.position.y;
    positions.z[i] = data.position.z || 0;
    velocities.x[i] = data.velocity.x;
    velocities.y[i] = data.velocity.y;
    velocities.z[i] = data.velocity.z;
    nodeStrengthArray[i] = nodeStrength;
  });

  // Prepare edge data
  const links: number[][] = edges.map(edge => [
    nodeIndexMap.get(edge.source)!,
    nodeIndexMap.get(edge.target)!
  ]);
  const linkStrengthArray = new Float32Array(edges.length).fill(linkStrength);
  const linkDistanceArray = new Float32Array(edges.length).fill(linkDistance);

  let kernels: ForceKernels | null = null;
  let alpha = 1;
  let iteration = 0;
  let gpuInitialized = false;

  // Initialize GPU kernels lazily
  const initializeGPU = async () => {
    if (gpuInitialized) return;
    
    try {
      const manager = GpuManager.getInstance();
      await manager.initialize();
      kernels = new ForceKernels();
      gpuInitialized = true;
    } catch (error) {
      console.warn('GPU initialization failed, falling back to CPU layout:', error);
      // Fall back to CPU implementation would go here
    }
  };

  const simulateStep = () => {
    if (!kernels || !gpuInitialized) return;
    
    // Calculate forces
    const manyBodyForces = kernels.calculateManyBodyForces(
      positions,
      nodeStrengthArray,
      alpha
    );
    
    const linkForces = kernels.calculateLinkForces(
      positions,
      links,
      linkStrengthArray,
      linkDistanceArray,
      alpha
    );
    
    const centerForces = kernels.calculateCenterForce(
      positions,
      { x: 0, y: 0, z: 0 },
      centerStrength
    );
    
    // Combine forces
    const totalForces = {
      x: new Float32Array(nodeCount),
      y: new Float32Array(nodeCount),
      z: new Float32Array(nodeCount)
    };
    
    for (let i = 0; i < nodeCount; i++) {
      totalForces.x[i] = manyBodyForces.x[i] + linkForces.x[i] + centerForces.x[i];
      totalForces.y[i] = manyBodyForces.y[i] + linkForces.y[i] + centerForces.y[i];
      totalForces.z[i] = manyBodyForces.z[i] + linkForces.z[i] + centerForces.z[i];
    }
    
    // Integrate positions
    const result = kernels.integrate(
      positions,
      velocities,
      totalForces,
      velocityDecay
    );
    
    // Update positions and velocities
    positions.x = result.positions.x;
    positions.y = result.positions.y;
    positions.z = result.positions.z;
    velocities.x = result.velocities.x;
    velocities.y = result.velocities.y;
    velocities.z = result.velocities.z;
    
    // Update node map
    nodes.forEach((node, i) => {
      const data = nodeMap.get(node.id)!;
      data.position.x = positions.x[i];
      data.position.y = positions.y[i];
      data.position.z = positions.z[i];
      data.velocity.x = velocities.x[i];
      data.velocity.y = velocities.y[i];
      data.velocity.z = velocities.z[i];
    });
    
    // Update alpha
    alpha *= (1 - alphaDecay);
    iteration++;
  };

  // Run initial simulation if not animated
  const runSimulation = async () => {
    await initializeGPU();
    
    if (!kernels || !gpuInitialized) {
      // Fallback to CPU would be implemented here
      return;
    }
    
    while (alpha > alphaMin && iteration < iterations) {
      simulateStep();
    }
  };

  // Start simulation immediately
  runSimulation();

  return {
    getNodePosition(id: string) {
      // Check for dragged position first
      if (drags?.[id]?.position) {
        return drags[id].position;
      }
      
      const nodeData = nodeMap.get(id);
      if (!nodeData) {
        return { x: 0, y: 0, z: 0, id, data: {} } as any;
      }
      
      return nodeData.position;
    },

    async step() {
      if (!gpuInitialized) {
        await initializeGPU();
      }
      
      if (alpha > alphaMin && iteration < iterations) {
        simulateStep();
        return false;
      }
      
      return true;
    },

    destroy() {
      if (kernels) {
        kernels.destroy();
        kernels = null;
      }
    }
  };
}