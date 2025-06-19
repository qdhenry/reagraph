import React from 'react';
import { GraphCanvas } from '../../src';
import { Meta, StoryObj } from '@storybook/react';

interface Node {
  id: string;
  label?: string;
  size?: number;
  fill?: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

// Utility function to generate large graphs for performance testing
const generateLargeGraph = (nodeCount: number, edgeCount: number) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Generate nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `Node ${i}`,
      size: Math.random() * 10 + 5,
      fill: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 5)]
    });
  }
  
  // Generate edges
  for (let i = 0; i < edgeCount; i++) {
    const sourceIdx = Math.floor(Math.random() * nodeCount);
    const targetIdx = Math.floor(Math.random() * nodeCount);
    
    if (sourceIdx !== targetIdx) {
      edges.push({
        id: `edge-${i}`,
        source: `node-${sourceIdx}`,
        target: `node-${targetIdx}`
      });
    }
  }
  
  return { nodes, edges };
};

const meta: Meta<typeof GraphCanvas> = {
  title: 'Performance/Instanced Nodes',
  component: GraphCanvas,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Performance comparison between individual nodes and instanced rendering for large graphs.'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Small graph - both approaches should perform similarly
const smallGraph = generateLargeGraph(50, 75);

export const SmallGraph_Individual: Story = {
  name: 'Small Graph (50 nodes) - Individual Rendering',
  args: {
    nodes: smallGraph.nodes,
    edges: smallGraph.edges,
    layoutType: 'forceDirected2d',
    draggable: true,
    enableInstancing: false,
    animated: true
  }
};

export const SmallGraph_Instanced: Story = {
  name: 'Small Graph (50 nodes) - Instanced Rendering',
  args: {
    nodes: smallGraph.nodes,
    edges: smallGraph.edges,
    layoutType: 'forceDirected2d',
    draggable: true,
    useInstancedNodes: true,
    animated: true
  }
};

// Medium graph - instanced should start showing benefits
const mediumGraph = generateLargeGraph(200, 300);

export const MediumGraph_Individual: Story = {
  name: 'Medium Graph (200 nodes) - Individual Rendering',
  args: {
    nodes: mediumGraph.nodes,
    edges: mediumGraph.edges,
    layoutType: 'forceDirected2d',
    draggable: true,
    enableInstancing: false,
    animated: true
  }
};

export const MediumGraph_Instanced: Story = {
  name: 'Medium Graph (200 nodes) - Instanced Rendering',
  args: {
    nodes: mediumGraph.nodes,
    edges: mediumGraph.edges,
    layoutType: 'forceDirected2d',
    draggable: true,
    useInstancedNodes: true,
    animated: true
  }
};

// Large graph - instanced should show significant benefits
const largeGraph = generateLargeGraph(1000, 1500);

export const LargeGraph_Individual: Story = {
  name: 'Large Graph (1000 nodes) - Individual Rendering',
  args: {
    nodes: largeGraph.nodes,
    edges: largeGraph.edges,
    layoutType: 'forceDirected2d',
    draggable: true,
    enableInstancing: false,
    animated: true
  }
};

export const LargeGraph_Instanced: Story = {
  name: 'Large Graph (1000 nodes) - Instanced Rendering',
  args: {
    nodes: largeGraph.nodes,
    edges: largeGraph.edges,
    layoutType: 'forceDirected2d',
    draggable: true,
    useInstancedNodes: true,
    animated: true
  }
};

// Auto-switching demonstration
export const AutoSwitching: Story = {
  name: 'Auto-Switching Demo (150 nodes)',
  args: {
    nodes: generateLargeGraph(150, 225).nodes,
    edges: generateLargeGraph(150, 225).edges,
    layoutType: 'forceDirected2d',
    draggable: true,
    // This should auto-switch to instanced rendering (default threshold is 100)
    animated: true
  }
};

// Very large graph - only instanced rendering should be practical
const veryLargeGraph = generateLargeGraph(2000, 3000);

export const VeryLargeGraph: Story = {
  name: 'Very Large Graph (2000 nodes) - Instanced Only',
  args: {
    nodes: veryLargeGraph.nodes,
    edges: veryLargeGraph.edges,
    layoutType: 'forceDirected2d',
    draggable: true,
    useInstancedNodes: true,
    animated: false // Disabled for performance
  }
};

// Performance monitoring demo with custom render
export const PerformanceMonitoring: Story = {
  name: 'Performance Monitoring (500 nodes)',
  render: (args) => {
    const graph = generateLargeGraph(500, 750);
    
    return (
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <GraphCanvas
          {...args}
          nodes={graph.nodes}
          edges={graph.edges}
          layoutType="forceDirected2d"
          draggable={true}
          useInstancedNodes={true}
          animated={true}
        />
        <div 
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        >
          <div>🚀 Instanced Rendering Enabled</div>
          <div>📊 Nodes: {graph.nodes.length}</div>
          <div>🔗 Edges: {graph.edges.length}</div>
          <div>⚡ Draw Calls: Significantly Reduced</div>
          <div>💾 Memory: Optimized</div>
        </div>
      </div>
    );
  }
};