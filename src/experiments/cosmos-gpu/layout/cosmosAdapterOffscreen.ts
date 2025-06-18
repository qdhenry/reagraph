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

export class CosmosAdapterOffscreen {
  private cosmos: CosmosGraph | null = null;
  private container: HTMLDivElement | null = null;
  private positionMap: Map<string, { x: number; y: number; z: number }> = new Map();
  private pinnedNodes: Set<string> = new Set();
  private nodeIdToIndex: Map<string, number> = new Map();

  constructor() {
    this.createOffscreenContainer();
  }

  private createOffscreenContainer() {
    // Create a completely hidden container for Cosmos
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      left: -10000px;
      top: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
      pointer-events: none;
      visibility: hidden;
      z-index: -9999;
    `;
    
    // Ensure it's added to body
    if (document.body) {
      document.body.appendChild(this.container);
    } else {
      // Wait for DOM ready
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.container!);
      });
    }
  }

  initialize(config?: Partial<GraphConfigInterface>) {
    if (!this.container) {
      console.error('Container not created');
      return;
    }

    try {
      this.cosmos = new CosmosGraph(this.container, {
        // Minimal rendering to save resources
        pointSize: 1,
        linkWidth: 1,
        renderLinks: false,
        curvedLinks: false,
        // Use passed config for simulation
        simulationGravity: config?.simulationGravity ?? 0.1,
        simulationCenter: config?.simulationCenter ?? 0.1,
        simulationRepulsion: config?.simulationRepulsion ?? 1.0,
        simulationLinkDistance: config?.simulationLinkDistance ?? 30,
        simulationLinkSpring: config?.simulationLinkSpring ?? 1.0,
        simulationFriction: config?.simulationFriction ?? 0.85,
        // Disable features we don't need
        spaceSize: 1000,
        pixelRatio: 1,
        cameraDistance: 500,
        ...config,
      });
      
      console.log('Cosmos adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Cosmos:', error);
    }
  }

  convertGraphologyToCosmos(graph: Graph): CosmosData {
    const nodes: CosmosNode[] = [];
    const links: CosmosLink[] = [];

    graph.forEachNode((nodeId, attributes) => {
      const node = attributes as InternalGraphNode;
      const cosmosNode: CosmosNode = {
        id: nodeId,
        x: node.position?.x || Math.random() * 100 - 50,
        y: node.position?.y || Math.random() * 100 - 50,
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
    if (!this.cosmos) {
      console.error('Cosmos not initialized');
      return;
    }
    
    // Clear previous mappings
    this.nodeIdToIndex.clear();
    
    // Create node ID to index mapping and positions array
    const positions = new Float32Array(data.nodes.length * 2);
    
    data.nodes.forEach((node, i) => {
      this.nodeIdToIndex.set(node.id, i);
      const x = node.x || Math.random() * 100 - 50;
      const y = node.y || Math.random() * 100 - 50;
      positions[i * 2] = x;
      positions[i * 2 + 1] = y;
      this.positionMap.set(node.id, { 
        x, 
        y, 
        z: node.z || 0 
      });
    });
    
    // Convert links to indices
    const validLinks: number[] = [];
    data.links.forEach((link) => {
      const sourceIndex = this.nodeIdToIndex.get(link.source);
      const targetIndex = this.nodeIdToIndex.get(link.target);
      if (sourceIndex !== undefined && targetIndex !== undefined) {
        validLinks.push(sourceIndex, targetIndex);
      }
    });
    
    const links = new Float32Array(validLinks);
    
    try {
      this.cosmos.setPointPositions(positions);
      this.cosmos.setLinks(links);
      // Don't render - we only need the simulation
      console.log(`Set data: ${data.nodes.length} nodes, ${data.links.length} links`);
    } catch (error) {
      console.error('Failed to set data:', error);
    }
  }

  updatePositions(graph: Graph) {
    if (!this.cosmos) return;

    try {
      const positions = this.cosmos.getPointPositions();
      if (!positions || positions.length === 0) return;

      // Update position map from cosmos positions
      this.nodeIdToIndex.forEach((index, nodeId) => {
        if (!this.pinnedNodes.has(nodeId)) {
          const x = positions[index * 2];
          const y = positions[index * 2 + 1];
          const z = 0; // Cosmos v2 is 2D only

          this.positionMap.set(nodeId, { x, y, z });
          
          // Update graphology attributes
          graph.setNodeAttribute(nodeId, 'x', x);
          graph.setNodeAttribute(nodeId, 'y', y);
          graph.setNodeAttribute(nodeId, 'z', z);
        }
      });
    } catch (error) {
      console.error('Failed to update positions:', error);
    }
  }

  getPositions(): Map<string, { x: number; y: number; z: number }> {
    return new Map(this.positionMap);
  }

  pinNode(nodeId: string, position: { x: number; y: number; z: number }) {
    this.pinnedNodes.add(nodeId);
    this.positionMap.set(nodeId, position);
  }

  unpinNode(nodeId: string) {
    this.pinnedNodes.delete(nodeId);
  }

  isPinned(nodeId: string): boolean {
    return this.pinnedNodes.has(nodeId);
  }

  start() {
    if (!this.cosmos) return;
    try {
      this.cosmos.start();
      console.log('Cosmos simulation started');
    } catch (error) {
      console.error('Failed to start simulation:', error);
    }
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
      try {
        this.cosmos.destroy();
      } catch (error) {
        console.error('Error destroying cosmos:', error);
      }
      this.cosmos = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }

    this.positionMap.clear();
    this.pinnedNodes.clear();
    this.nodeIdToIndex.clear();
  }

  getSimulationProgress(): number {
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