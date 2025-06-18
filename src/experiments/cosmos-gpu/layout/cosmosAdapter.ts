import { Graph as CosmosGraph, GraphConfigInterface } from '@cosmos.gl/graph';
import Graph from 'graphology';
import { InternalGraphNode, InternalGraphEdge } from '../../../types';

export interface CosmosNode {
  id: string;
  x?: number;
  y?: number;
  z?: number;
  [key: string]: any;
}

export interface CosmosLink {
  source: string;
  target: string;
  [key: string]: any;
}

export interface CosmosData {
  nodes: CosmosNode[];
  links: CosmosLink[];
}

export class CosmosAdapter {
  private cosmos: CosmosGraph | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private positionMap: Map<string, { x: number; y: number; z: number }> = new Map();
  private pinnedNodes: Set<string> = new Set();

  constructor() {
    this.createHiddenCanvas();
  }

  private createHiddenCanvas() {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    div.style.top = '-9999px';
    div.style.width = '800px';
    div.style.height = '600px';
    document.body.appendChild(div);
    this.canvas = div as any; // Store div reference for cosmos
  }

  initialize(config?: Partial<GraphConfigInterface>) {
    if (!this.canvas) return;

    this.cosmos = new CosmosGraph(this.canvas as any as HTMLDivElement, {
      pointSize: 4,
      linkWidth: 1,
      renderLinks: true,
      curvedLinks: false,
      simulationGravity: 0.1,
      simulationCenter: 0.1,
      simulationRepulsion: 1.0,
      simulationLinkDistance: 30,
      simulationLinkSpring: 1.0,
      simulationFriction: 0.85, // 1 - velocityDecay
      ...config,
    });
  }

  convertGraphologyToCosmos(graph: Graph): CosmosData {
    const nodes: CosmosNode[] = [];
    const links: CosmosLink[] = [];

    graph.forEachNode((nodeId, attributes) => {
      const node = attributes as InternalGraphNode;
      const cosmosNode: CosmosNode = {
        id: nodeId,
        x: node.position?.x || 0,
        y: node.position?.y || 0,
        z: node.position?.z || 0,
        ...node.data,
      };
      nodes.push(cosmosNode);
    });

    graph.forEachEdge((edgeId, attributes, source, target) => {
      const edge = attributes as InternalGraphEdge;
      const cosmosLink: CosmosLink = {
        source,
        target,
        ...edge.data,
      };
      links.push(cosmosLink);
    });

    return { nodes, links };
  }

  setData(data: CosmosData) {
    if (!this.cosmos) return;
    
    // Create node ID to index mapping
    const nodeIdToIndex = new Map<string, number>();
    const positions = new Float32Array(data.nodes.length * 2);
    
    data.nodes.forEach((node, i) => {
      nodeIdToIndex.set(node.id, i);
      positions[i * 2] = node.x || Math.random() * 100 - 50;
      positions[i * 2 + 1] = node.y || Math.random() * 100 - 50;
      this.positionMap.set(node.id, { 
        x: positions[i * 2], 
        y: positions[i * 2 + 1], 
        z: node.z || 0 
      });
    });
    
    // Convert links to indices
    const links = new Float32Array(data.links.length * 2);
    data.links.forEach((link, i) => {
      const sourceIndex = nodeIdToIndex.get(link.source);
      const targetIndex = nodeIdToIndex.get(link.target);
      if (sourceIndex !== undefined && targetIndex !== undefined) {
        links[i * 2] = sourceIndex;
        links[i * 2 + 1] = targetIndex;
      }
    });
    
    this.cosmos.setPointPositions(positions);
    this.cosmos.setLinks(links);
    this.cosmos.render();
  }

  updatePositions(graph: Graph) {
    if (!this.cosmos) return;

    const positions = this.cosmos.getPointPositions();
    if (!positions || positions.length === 0) return;

    let i = 0;
    graph.forEachNode((nodeId) => {
      const x = positions[i * 2];
      const y = positions[i * 2 + 1];
      const z = 0; // Cosmos v2 is 2D only

      if (!this.pinnedNodes.has(nodeId)) {
        this.positionMap.set(nodeId, { x, y, z });
        graph.setNodeAttribute(nodeId, 'x', x);
        graph.setNodeAttribute(nodeId, 'y', y);
        graph.setNodeAttribute(nodeId, 'z', z);
      }
      i++;
    });
  }

  getPositions(): Map<string, { x: number; y: number; z: number }> {
    return new Map(this.positionMap);
  }

  pinNode(nodeId: string, position: { x: number; y: number; z: number }) {
    this.pinnedNodes.add(nodeId);
    this.positionMap.set(nodeId, position);
    
    // Note: Cosmos v2 doesn't have direct node pinning API
    // We'll handle this by not updating pinned nodes from cosmos positions
  }

  unpinNode(nodeId: string) {
    this.pinnedNodes.delete(nodeId);
  }

  isPinned(nodeId: string): boolean {
    return this.pinnedNodes.has(nodeId);
  }

  start() {
    if (!this.cosmos) return;
    this.cosmos.start();
  }

  pause() {
    if (!this.cosmos) return;
    this.cosmos.pause();
  }

  restart() {
    if (!this.cosmos) return;
    this.cosmos.restart();
  }

  dispose() {
    if (this.cosmos) {
      this.cosmos.destroy();
      this.cosmos = null;
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }

    this.positionMap.clear();
    this.pinnedNodes.clear();
  }

  getSimulationProgress(): number {
    // Cosmos v2 doesn't have getSimulationProgress
    // We'll estimate based on whether simulation is running
    return this.isSimulationRunning() ? 0.5 : 1;
  }

  isSimulationRunning(): boolean {
    if (!this.cosmos) return false;
    return this.cosmos.isSimulationRunning;
  }

  setConfig(config: Partial<GraphConfigInterface>) {
    if (!this.cosmos) return;
    this.cosmos.setConfig(config);
  }
}