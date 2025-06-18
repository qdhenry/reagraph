import Graph from 'graphology';
import { LayoutStrategy, LayoutFactoryProps } from '../../../layout';
import { InternalGraphPosition, InternalGraphNode } from '../../../types';
import { CosmosAdapterOffscreen } from './cosmosAdapterOffscreen';
import { GraphConfigInterface } from '@cosmos.gl/graph';
import { buildNodeEdges } from '../../../layout/layoutUtils';

export interface GpuForceDirectedLayoutOptions extends LayoutFactoryProps {
  iterations?: number;
  nodeRepulsion?: number;
  linkDistance?: number;
  linkSpring?: number;
  gravity?: number;
  centerForce?: number;
  velocityDecay?: number;
  is3d?: boolean;
  cosmosConfig?: Partial<GraphConfigInterface>;
}

export function gpuForceDirected({
  graph,
  iterations = 300,
  nodeRepulsion = 1.0,
  linkDistance = 30,
  linkSpring = 1.0,
  gravity = 0.1,
  centerForce = 0.1,
  velocityDecay = 0.15,
  is3d = true,
  cosmosConfig,
  getNodePosition,
  drags
}: GpuForceDirectedLayoutOptions): LayoutStrategy {
  const cosmosAdapter = new CosmosAdapterOffscreen();
  const { nodes } = buildNodeEdges(graph);
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // Initialize cosmos with config
  cosmosAdapter.initialize({
    ...cosmosConfig,
    simulationGravity: gravity,
    simulationCenter: centerForce,
    simulationRepulsion: nodeRepulsion,
    simulationLinkDistance: linkDistance,
    simulationLinkSpring: linkSpring,
    simulationFriction: 1 - velocityDecay,
  });

  // Convert and set data
  const cosmosData = cosmosAdapter.convertGraphologyToCosmos(graph);
  cosmosAdapter.setData(cosmosData);
  cosmosAdapter.start();

  return {
    getNodePosition(id: string) {
      if (getNodePosition) {
        const pos = getNodePosition(id, { graph, drags, nodes: [], edges: [] });
        if (pos) {
          return pos;
        }
      }

      if (drags?.[id]?.position) {
        // If we dragged, we need to use that position
        return drags[id].position;
      }

      const node = nodeMap.get(id);
      if (!node) {
        return { x: 0, y: 0, z: 0, id, data: {} } as any;
      }

      const positions = cosmosAdapter.getPositions();
      
      if (positions.has(id)) {
        const pos = positions.get(id)!;
        // Return the node's position with updated coordinates from cosmos
        return {
          ...node.position,
          x: pos.x,
          y: pos.y,
          z: pos.z
        };
      }

      return node.position;
    },

    step(): boolean | undefined {
      cosmosAdapter.updatePositions(graph);
      return !cosmosAdapter.isSimulationRunning();
    }
  };
}