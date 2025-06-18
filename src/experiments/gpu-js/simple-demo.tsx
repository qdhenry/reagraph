import React from 'react';
import { GraphCanvas } from '../../GraphCanvas';

const simpleNodes = [
  { id: '1', label: 'Node 1' },
  { id: '2', label: 'Node 2' },
  { id: '3', label: 'Node 3' },
  { id: '4', label: 'Node 4' },
  { id: '5', label: 'Node 5' }
];

const simpleEdges = [
  { id: 'e1', source: '1', target: '2' },
  { id: 'e2', source: '1', target: '3' },
  { id: 'e3', source: '2', target: '4' },
  { id: 'e4', source: '3', target: '5' },
  { id: 'e5', source: '4', target: '5' }
];

export function SimpleGpuDemo() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <h1 style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        Simple GPU.js Demo (Using Standard GraphCanvas)
      </h1>
      <GraphCanvas
        nodes={simpleNodes}
        edges={simpleEdges}
        layoutType="forceDirected"
      />
    </div>
  );
}