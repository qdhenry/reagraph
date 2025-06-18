import React, { useState } from 'react';
import { GpuGraphCanvas } from './GpuGraphCanvas';

// Generate a larger dataset for testing
function generateLargeGraph(nodeCount: number) {
  const nodes = [];
  const edges = [];
  
  // Create nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `Node ${i}`,
      fill: `hsl(${(i * 137.5) % 360}, 70%, 50%)` // Golden angle for color distribution
    });
  }
  
  // Create edges (random connections with some structure)
  const edgeCount = Math.floor(nodeCount * 1.5);
  for (let i = 0; i < edgeCount; i++) {
    const source = Math.floor(Math.random() * nodeCount);
    let target = Math.floor(Math.random() * nodeCount);
    
    // Avoid self-loops
    while (target === source) {
      target = Math.floor(Math.random() * nodeCount);
    }
    
    edges.push({
      id: `edge-${i}`,
      source: `node-${source}`,
      target: `node-${target}`
    });
  }
  
  return { nodes, edges };
}

export const GpuGraphScene: React.FC = () => {
  console.log('GpuGraphScene rendering');
  const [nodeCount, setNodeCount] = useState(100);
  const [useGpu, setUseGpu] = useState(true);
  const [graphData, setGraphData] = useState(() => generateLargeGraph(nodeCount));
  
  const handleNodeCountChange = (count: number) => {
    setNodeCount(count);
    setGraphData(generateLargeGraph(count));
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>GPU.js Force-Directed Layout</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label>
            <input
              type="checkbox"
              checked={useGpu}
              onChange={(e) => setUseGpu(e.target.checked)}
            />
            {' '}Use GPU acceleration
          </label>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <label>
            Node Count: {nodeCount}
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={nodeCount}
              onChange={(e) => handleNodeCountChange(Number(e.target.value))}
              style={{ display: 'block', width: '200px', marginTop: '4px' }}
            />
          </label>
        </div>
        
        <button
          onClick={() => setGraphData(generateLargeGraph(nodeCount))}
          style={{
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Regenerate Graph
        </button>
      </div>
      
      <GpuGraphCanvas
        nodes={graphData.nodes}
        edges={graphData.edges}
        useGpuLayout={useGpu}
        animated={nodeCount < 200} // Disable animations for large graphs
        edgeArrowPosition="none" // Disable arrows for performance
        minNodeSize={2}
        maxNodeSize={10}
      />
    </div>
  );
};