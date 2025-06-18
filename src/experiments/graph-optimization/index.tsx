import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraphCanvas } from '../../GraphCanvas';
import { simpleNodes, simpleEdges } from '../../../docs/assets/demo';

export const GraphOptimizationExperiment: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <header style={{ 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd' 
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Graph Optimization Experiments</h1>
        <p style={{ margin: '10px 0 0 0', color: '#666' }}>
          Performance Comparisons: Web Workers and GPU Acceleration
        </p>
      </header>
      
      <nav style={{ 
        padding: '15px 20px', 
        backgroundColor: '#fafafa',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#666' }}>Web Workers:</span>
          <button 
            onClick={() => navigate('/baseline')}
            style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', padding: 0 }}
          >
            Baseline
          </button>
          <button 
            onClick={() => navigate('/optimized')}
            style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', padding: 0 }}
          >
            Optimized
          </button>
          <button 
            onClick={() => navigate('/compare')}
            style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', padding: 0 }}
          >
            Compare
          </button>
          <button 
            onClick={() => navigate('/metrics')}
            style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', padding: 0 }}
          >
            Metrics Dashboard
          </button>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginLeft: 'auto' }}>
          <span style={{ fontWeight: 'bold', color: '#666' }}>GPU:</span>
          <button 
            onClick={() => navigate('/cosmos-gpu')}
            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0 }}
          >
            Cosmos GPU
          </button>
          <button 
            onClick={() => navigate('/cosmos-compare')}
            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0 }}
          >
            CPU vs GPU
          </button>
          <button 
            onClick={() => navigate('/gpu-js')}
            style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', padding: 0 }}
          >
            GPU.js
          </button>
        </div>
      </nav>
      
      <main style={{ 
        flex: 1, 
        padding: '30px',
        backgroundColor: '#ffffff',
        overflow: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <section style={{ marginBottom: '40px' }}>
            <h2>Overview</h2>
            <p>
              These experiments explore different optimization strategies for graph rendering performance.
              We compare Web Workers for CPU parallelization and GPU acceleration using Cosmos.
            </p>
          </section>
          
          <section style={{ marginBottom: '40px' }}>
            <h3>Test Scenarios</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4>Web Workers Optimization</h4>
                <ul>
                  <li><strong>Baseline:</strong> Original implementation running on the main thread</li>
                  <li><strong>Optimized:</strong> Web Worker implementation with offloaded calculations</li>
                  <li><strong>Compare:</strong> Side-by-side comparison with real-time metrics</li>
                  <li><strong>Metrics Dashboard:</strong> Detailed performance analysis</li>
                </ul>
              </div>
              <div>
                <h4>GPU Acceleration</h4>
                <ul>
                  <li><strong>Cosmos GPU:</strong> GPU-accelerated layout using @cosmos.gl/graph</li>
                  <li><strong>CPU vs GPU:</strong> Direct performance comparison between CPU and GPU implementations</li>
                  <li><strong>GPU.js:</strong> Custom GPU kernels for force calculations using GPU.js</li>
                </ul>
              </div>
            </div>
          </section>
          
          <section>
            <h3>Quick Demo</h3>
            <div style={{ height: '400px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
              <GraphCanvas 
                nodes={simpleNodes} 
                edges={simpleEdges}
                layoutType="forceDirected2d"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};