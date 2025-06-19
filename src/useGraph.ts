import { useRef, useCallback, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { SizingType } from './sizing';
import {
  LayoutTypes,
  layoutProvider,
  LayoutStrategy,
  LayoutOverrides
} from './layout';
import { LabelVisibilityType, calcLabelVisibility } from './utils/visibility';
import { tick } from './layout/layoutUtils';
import { GraphEdge, GraphNode, InternalGraphNode } from './types';
import { buildGraph, transformGraph } from './utils/graph';
import { DragReferences, useStore } from './store';
import { getVisibleEntities } from './collapse';
import { calculateClusters } from './utils/cluster';
import {
  LayoutManager,
  type PositionUpdate,
  type WorkerNode,
  type WorkerEdge
} from './workers/LayoutManager';

export interface GraphInputs {
  nodes: GraphNode[];
  edges: GraphEdge[];
  collapsedNodeIds?: string[];
  layoutType?: LayoutTypes;
  sizingType?: SizingType;
  labelType?: LabelVisibilityType;
  sizingAttribute?: string;
  selections?: string[];
  actives?: string[];
  clusterAttribute?: string;
  defaultNodeSize?: number;
  minNodeSize?: number;
  maxNodeSize?: number;
  constrainDragging?: boolean;
  layoutOverrides?: LayoutOverrides;
}

export const useGraph = ({
  layoutType,
  sizingType,
  labelType,
  sizingAttribute,
  clusterAttribute,
  selections,
  nodes,
  edges,
  actives,
  collapsedNodeIds,
  defaultNodeSize,
  maxNodeSize,
  minNodeSize,
  layoutOverrides,
  constrainDragging
}: GraphInputs) => {
  const graph = useStore(state => state.graph);
  const clusters = useStore(state => state.clusters);
  const storedNodes = useStore(state => state.nodes);
  const setClusters = useStore(state => state.setClusters);
  const stateCollapsedNodeIds = useStore(state => state.collapsedNodeIds);
  const setEdges = useStore(state => state.setEdges);
  const stateNodes = useStore(state => state.nodes);
  const setNodes = useStore(state => state.setNodes);
  const setSelections = useStore(state => state.setSelections);
  const setActives = useStore(state => state.setActives);
  const drags = useStore(state => state.drags);
  const setDrags = useStore(state => state.setDrags);
  const setCollapsedNodeIds = useStore(state => state.setCollapsedNodeIds);
  const layoutMounted = useRef<boolean>(false);
  const layout = useRef<LayoutStrategy | null>(null);
  const layoutManager = useRef<LayoutManager | null>(null);
  const camera = useThree(state => state.camera) as PerspectiveCamera;
  const dragRef = useRef<DragReferences>(drags);
  const clustersRef = useRef<any>([]);

  // When a new node is added, remove the dragged position of the cluster nodes to put new node in the right place
  useEffect(() => {
    if (!clusterAttribute) {
      return;
    }

    const existedNodesIds = storedNodes.map(n => n.id);
    const newNode = nodes.find(n => !existedNodesIds.includes(n.id));
    if (newNode) {
      const clusterName = newNode.data[clusterAttribute];
      const cluster = clusters.get(clusterName);
      const drags = { ...dragRef.current };

      cluster?.nodes?.forEach(node => (drags[node.id] = undefined));

      dragRef.current = drags;
      setDrags(drags);
    }
  }, [storedNodes, nodes, clusterAttribute, clusters, setDrags]);

  // Calculate the visible entities
  const { visibleEdges, visibleNodes } = useMemo(
    () =>
      getVisibleEntities({
        collapsedIds: stateCollapsedNodeIds,
        nodes,
        edges
      }),
    [stateCollapsedNodeIds, nodes, edges]
  );

  // Store node positions inside drags state
  const updateDrags = useCallback(
    (nodes: InternalGraphNode[]) => {
      const drags = { ...dragRef.current };
      nodes.forEach(node => (drags[node.id] = node));
      dragRef.current = drags;
      setDrags(drags);
    },
    [setDrags]
  );

  // Helper function to update node positions from worker updates
  const updateNodePositionsFromWorker = useCallback(
    (positions: PositionUpdate[]) => {
      // Update the graph with new positions
      positions.forEach(({ nodeId, x, y, z }) => {
        if (graph.hasNode(nodeId)) {
          graph.setNodeAttribute(nodeId, 'x', x);
          graph.setNodeAttribute(nodeId, 'y', y);
          graph.setNodeAttribute(nodeId, 'z', z);
        }
      });

      // Trigger a re-render by updating the nodes in the store
      // This is a lightweight update that doesn't recalculate the entire layout
      const currentNodes = stateNodes;
      const updatedNodes = currentNodes.map(node => {
        const positionUpdate = positions.find(p => p.nodeId === node.id);
        if (positionUpdate) {
          return {
            ...node,
            position: {
              ...node.position,
              x: positionUpdate.x,
              y: positionUpdate.y,
              z: positionUpdate.z
            }
          };
        }
        return node;
      });

      setNodes(updatedNodes);
    },
    [graph, setNodes, stateNodes]
  );

  // Helper function to determine if we should use workers for the current layout
  const shouldUseWorkers = useCallback(
    (layoutType: LayoutTypes | undefined, nodeCount: number) => {
      // Use workers for force-directed layouts with sufficient nodes
      return (
        (layoutType === 'forceDirected2d' ||
          layoutType === 'forceDirected3d') &&
        nodeCount >= 100 // Threshold for when workers become beneficial
      );
    },
    []
  );

  // Convert graph nodes/edges to worker format
  const convertToWorkerFormat = useCallback((graph: any) => {
    const workerNodes: WorkerNode[] = [];
    const workerEdges: WorkerEdge[] = [];

    graph.forEachNode((id: string, node: any) => {
      const draggedPosition = dragRef.current?.[id]?.position;
      workerNodes.push({
        id,
        x: draggedPosition?.x ?? node.x ?? 0,
        y: draggedPosition?.y ?? node.y ?? 0,
        z: draggedPosition?.z ?? node.z ?? 0,
        radius: node.radius || node.size || 5,
        mass: node.mass || 1,
        // Fix nodes that have been dragged
        fx: draggedPosition ? draggedPosition.x : null,
        fy: draggedPosition ? draggedPosition.y : null,
        fz: draggedPosition ? draggedPosition.z : null
      });
    });

    graph.forEachEdge((id: string, edge: any) => {
      workerEdges.push({
        id,
        source: edge.source,
        target: edge.target,
        distance: edge.distance || 50,
        strength: edge.strength || 0.1
      });
    });

    return { workerNodes, workerEdges };
  }, []);

  const updateLayout = useCallback(
    async (curLayout?: any) => {
      const nodeCount = graph.order;
      const useWorkers = shouldUseWorkers(layoutType, nodeCount);

      if (useWorkers && !curLayout) {
        console.log(
          `[useGraph] Using worker-based layout for ${nodeCount} nodes`
        );

        // Initialize layout manager if needed
        if (!layoutManager.current) {
          layoutManager.current = new LayoutManager();
          await layoutManager.current.initialize(
            nodeCount,
            (positions: PositionUpdate[]) => {
              // Update node positions in real-time as they come from the worker
              updateNodePositionsFromWorker(positions);
            }
          );
        }

        // Convert to worker format
        const { workerNodes, workerEdges } = convertToWorkerFormat(graph);

        // Start worker simulation
        await layoutManager.current.simulate(workerNodes, workerEdges, {
          center: { x: 0, y: 0, z: 0 },
          manyBodyStrength: -250,
          linkDistance: 50,
          linkStrength: 0.1,
          alpha: 1.0,
          alphaDecay: 0.0228,
          velocityDecay: 0.4
        });

        // After simulation completes, do final transform
        layout.current = {
          step: () => true,
          getNodePosition: (id: string) => {
            if (dragRef.current?.[id]?.position) {
              return dragRef.current[id].position as any;
            }
            // Find the node from the last worker update
            const workerNode = workerNodes.find(n => n.id === id);
            if (workerNode) {
              return {
                id: workerNode.id,
                x: workerNode.x || 0,
                y: workerNode.y || 0,
                z: workerNode.z || 0
              } as any;
            }
            return { id, x: 0, y: 0, z: 0 } as any;
          }
        };
      } else {
        // Use traditional layout
        layout.current =
          curLayout ||
          layoutProvider({
            ...layoutOverrides,
            type: layoutType,
            graph,
            drags: dragRef.current,
            clusters: clustersRef?.current,
            clusterAttribute
          });

        // Run the layout
        await tick(layout.current);
      }

      // Transform the graph
      const result = transformGraph({
        graph,
        layout: layout.current,
        sizingType,
        labelType,
        sizingAttribute,
        maxNodeSize,
        minNodeSize,
        defaultNodeSize,
        clusterAttribute
      });

      // Calculate clusters
      const newClusters = calculateClusters({
        nodes: result.nodes,
        clusterAttribute
      });

      // Do not decrease the cluster size is the number of nodes is the same
      if (constrainDragging) {
        newClusters.forEach(cluster => {
          const prevCluster = clustersRef.current.get(cluster.label);
          if (prevCluster?.nodes.length === cluster.nodes.length) {
            cluster.position =
              clustersRef.current?.get(cluster.label)?.position ??
              cluster.position;
          }
        });
      }

      // Set our store outputs
      setEdges(result.edges);
      setNodes(result.nodes);
      setClusters(newClusters);
      if (clusterAttribute) {
        // Set drag positions for nodes to prevent them from being moved by the layout update
        updateDrags(result.nodes);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      layoutOverrides,
      layoutType,
      clusterAttribute,
      sizingType,
      labelType,
      sizingAttribute,
      maxNodeSize,
      minNodeSize,
      defaultNodeSize,
      setEdges,
      setNodes,
      setClusters
    ]
  );

  // Transient updates
  useEffect(() => {
    dragRef.current = drags;
  }, [drags, clusterAttribute, updateLayout]);

  // Transient cluster state
  useEffect(() => {
    clustersRef.current = clusters;
  }, [clusters]);

  useEffect(() => {
    // When the camera position/zoom changes, update the label visibility
    const nodes = stateNodes.map(node => ({
      ...node,
      labelVisible: calcLabelVisibility({
        nodeCount: stateNodes?.length,
        labelType,
        camera,
        nodePosition: node?.position
      })('node', node?.size)
    }));

    // Determine if the label visibility has changed
    const isVisibilityUpdated = nodes.some(
      (node, i) => node.labelVisible !== stateNodes[i].labelVisible
    );

    // Update the nodes if the label visibility has changed
    if (isVisibilityUpdated) {
      setNodes(nodes);
    }
  }, [camera, camera.zoom, camera.position.z, setNodes, stateNodes, labelType]);

  useEffect(() => {
    // Let's set the store selections so its easier to access
    if (layoutMounted.current) {
      setSelections(selections);
    }
  }, [selections, setSelections]);

  useEffect(() => {
    // Let's set the store actives so its easier to access
    if (layoutMounted.current) {
      setActives(actives);
    }
  }, [actives, setActives]);

  // Create the nggraph graph object
  useEffect(() => {
    async function update() {
      layoutMounted.current = false;
      buildGraph(graph, visibleNodes, visibleEdges);
      await updateLayout();
      // rqf to prevent race condition
      requestAnimationFrame(() => (layoutMounted.current = true));
    }

    update();
    // eslint-disable-next-line
  }, [visibleNodes, visibleEdges]);

  useEffect(() => {
    // Let's set the store collapsedNodeIds so its easier to access
    if (layoutMounted.current) {
      setCollapsedNodeIds(collapsedNodeIds);
    }
  }, [collapsedNodeIds, setCollapsedNodeIds]);

  // Update layout on type changes
  useEffect(() => {
    if (layoutMounted.current) {
      // When a update is changed, discard all the previous drag positions
      // NOTE: This sets the transient and the state
      dragRef.current = {};
      setDrags({});

      // Recalculate the layout
      updateLayout();
    }
  }, [layoutType, updateLayout, setDrags]);

  // Update layout on size, label changes
  useEffect(() => {
    if (layoutMounted.current) {
      updateLayout(layout.current);
    }
  }, [sizingType, sizingAttribute, labelType, updateLayout]);

  // Cleanup layout manager on unmount
  useEffect(() => {
    return () => {
      if (layoutManager.current) {
        layoutManager.current.dispose();
        layoutManager.current = null;
      }
    };
  }, []);

  return {
    updateLayout,
    getLayoutManagerStatus: () => layoutManager.current?.getStatus() || null
  };
};
