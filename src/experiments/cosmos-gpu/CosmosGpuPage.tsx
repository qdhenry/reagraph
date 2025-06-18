import React from 'react';
import { useNavigate } from 'react-router-dom';
import { lightTheme } from '../../themes';
import { simpleNodes, simpleEdges } from '../../../docs/assets/demo';
import { CosmosGraphCanvas } from './components/CosmosGraphCanvas';

export function CosmosGpuPage() {
  const navigate = useNavigate();

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => navigate('/experiments')} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          ← Back to Experiments
        </button>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Cosmos GPU Integration</h1>
        <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#666' }}>
          GPU-accelerated graph layout using @cosmos.gl/graph
        </span>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <CosmosGraphCanvas
          nodes={simpleNodes}
          edges={simpleEdges}
          theme={lightTheme}
          layoutType="custom"
          defaultNodeSize={7}
        />
      </div>
    </div>
  );
}