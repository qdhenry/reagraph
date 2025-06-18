import { useEffect, useState, useCallback, useRef } from 'react';
import { workerBridge } from '../../workers/WorkerBridge';
// import { mockWorkerBridge as workerBridge } from '../../workers/mockWorkerBridge';
import { InternalGraphNode, InternalGraphEdge } from '../../../../types';

export interface UseWorkerLayoutProps {
  nodes: InternalGraphNode[];
  edges: InternalGraphEdge[];
  layoutType: string;
  enabled?: boolean;
  onLayoutComplete?: (nodes: InternalGraphNode[]) => void;
}

export function useWorkerLayout({
  nodes,
  edges,
  layoutType,
  enabled = true,
  onLayoutComplete
}: UseWorkerLayoutProps) {
  // Initialize nodes with default positions if they don't have any
  const initialNodes = nodes.map(node => ({
    ...node,
    position: node.position || { x: 0, y: 0, z: 0 }
  }));
  const [layoutNodes, setLayoutNodes] = useState<InternalGraphNode[]>(initialNodes);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [workerUtilization, setWorkerUtilization] = useState(0);
  const calculationRef = useRef<boolean>(false);
  
  const calculateLayout = useCallback(async () => {
    if (!enabled || calculationRef.current) return;
    
    calculationRef.current = true;
    setIsCalculating(true);
    setError(null);
    
    try {
      const result = await workerBridge.calculateLayout({
        nodes: nodes.map(n => ({
          id: n.id,
          x: n.position?.x,
          y: n.position?.y,
          z: n.position?.z,
          radius: n.size
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target
        })),
        layoutType,
        dimensions: layoutType.includes('2d') ? 2 : 3
      });
      
      // Map the calculated positions back to the nodes
      const updatedNodes = nodes.map(node => {
        const calculatedNode = result.nodes.find(n => n.id === node.id);
        if (calculatedNode) {
          return {
            ...node,
            position: {
              x: calculatedNode.x || 0,
              y: calculatedNode.y || 0,
              z: calculatedNode.z || 0
            }
          };
        }
        return node;
      });
      
      setLayoutNodes(updatedNodes);
      
      if (onLayoutComplete) {
        onLayoutComplete(updatedNodes);
      }
      
      // Update worker utilization
      setWorkerUtilization(workerBridge.getWorkerUtilization());
      
    } catch (err) {
      console.error('Layout calculation failed:', err);
      setError(err as Error);
      // Fallback to original nodes with default positions
      const fallbackNodes = nodes.map(node => ({
        ...node,
        position: node.position || { x: 0, y: 0, z: 0 }
      }));
      setLayoutNodes(fallbackNodes);
    } finally {
      setIsCalculating(false);
      calculationRef.current = false;
    }
  }, [nodes, edges, layoutType, enabled, onLayoutComplete]);
  
  // Recalculate layout when inputs change
  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);
  
  // Update worker utilization periodically
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      setWorkerUtilization(workerBridge.getWorkerUtilization());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [enabled]);
  
  return {
    nodes: layoutNodes,
    isCalculating,
    error,
    workerUtilization,
    recalculate: calculateLayout
  };
}