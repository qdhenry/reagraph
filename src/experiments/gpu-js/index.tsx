import React from 'react';
import { useNavigate } from 'react-router-dom';

export function GpuJsExperiment() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px' }}>
      <h1>GPU.js Integration Experiment</h1>
      <p>Accelerating graph computations with GPU.js</p>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
        <button 
          onClick={() => navigate('/gpu-js/demo')}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          GPU.js Demo
        </button>
        
        <button 
          onClick={() => navigate('/gpu-js/comparison')}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Performance Comparison
        </button>
        
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Back to Experiments
        </button>
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <h2>Implementation Details</h2>
        <ul>
          <li>GPU-accelerated force-directed layout</li>
          <li>Parallel computation of n-body forces</li>
          <li>Maintains compatibility with React Three Fiber</li>
          <li>Progressive enhancement with CPU fallback</li>
        </ul>
      </div>
    </div>
  );
}