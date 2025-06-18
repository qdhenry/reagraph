import { GraphNode, GraphEdge, InternalGraphNode, InternalGraphEdge } from '../../../types';
import Graph from 'graphology';
import { CosmosNode, CosmosLink } from '../layout/cosmosAdapter';

export interface GraphInput {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
}

export interface GraphOutput {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function normalizeCosmosData(input: GraphInput): { nodes: CosmosNode[]; links: CosmosLink[] } {
  const nodeMap = new Map<string, CosmosNode>();
  const links: CosmosLink[] = [];

  if (input.nodes) {
    input.nodes.forEach((node) => {
      const cosmosNode: CosmosNode = {
        id: node.id,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        z: 0,
        ...node.data,
      };
      nodeMap.set(node.id, cosmosNode);
    });
  }

  if (input.edges) {
    input.edges.forEach((edge) => {
      const source = edge.source;
      const target = edge.target;

      if (!nodeMap.has(source)) {
        const sourceNode: CosmosNode = {
          id: source,
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50,
          z: 0,
        };
        nodeMap.set(source, sourceNode);
      }

      if (!nodeMap.has(target)) {
        const targetNode: CosmosNode = {
          id: target,
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50,
          z: 0,
        };
        nodeMap.set(target, targetNode);
      }

      const cosmosLink: CosmosLink = {
        source,
        target,
        id: edge.id,
        ...edge.data,
      };
      links.push(cosmosLink);
    });
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links,
  };
}

export function cosmosToGraphology(nodes: CosmosNode[], links: CosmosLink[]): Graph {
  const graph = new Graph({ multi: true, type: 'mixed' });

  nodes.forEach((node) => {
    const { id, x, y, z, ...data } = node;
    graph.addNode(id, {
      x: x || 0,
      y: y || 0,
      z: z || 0,
      data,
    });
  });

  links.forEach((link) => {
    const { source, target, id, ...data } = link;
    graph.addEdge(source, target, {
      id: id || `${source}-${target}`,
      source,
      target,
      data,
    });
  });

  return graph;
}

export function graphologyToGraphOutput(graph: Graph): GraphOutput {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  graph.forEachNode((nodeId, attributes) => {
    const node = attributes as InternalGraphNode;
    nodes.push({
      id: nodeId,
      data: node.data || {},
      size: node.size,
      label: node.label,
      fill: node.fill,
    });
  });

  graph.forEachEdge((edgeId, attributes, source, target) => {
    const edge = attributes as InternalGraphEdge;
    edges.push({
      id: edgeId,
      source,
      target,
      data: edge.data || {},
    });
  });

  return { nodes, edges };
}