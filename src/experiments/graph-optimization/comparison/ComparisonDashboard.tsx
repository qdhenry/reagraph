import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraphCanvas } from '../../../GraphCanvas';
import { OptimizedGraphCanvas } from '../optimized/OptimizedGraphCanvas';
import { lightTheme } from '../../../themes';
import { simpleNodes, simpleEdges } from '../../../../docs/assets/demo';
import { PerformanceMonitor, ProfilerWrapper } from '../metrics';

export const ComparisonDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [nodeCount, setNodeCount] = useState(100);
  const [layoutType, setLayoutType] = useState<string>('forceDirected2d');
  const [syncControls, setSyncControls] = useState(true);
  const [baselineMetrics, setBaselineMetrics] = useState<any>({});
  const [optimizedMetrics, setOptimizedMetrics] = useState<any>({});
  
  // Generate test data based on node count
  const generateTestData = (count: number) => {
    const nodes = Array.from({ length: count }, (_, i) => ({
      id: `node-${i}`,
      label: `Node ${i}`
    }));
    
    const edges = Array.from({ length: Math.floor(count * 1.5) }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${Math.floor(Math.random() * count)}`,
      target: `node-${Math.floor(Math.random() * count)}`
    }));
    
    return { nodes, edges };
  };
  
  const { nodes, edges } = nodeCount <= 10 
    ? { nodes: simpleNodes, edges: simpleEdges }
    : generateTestData(nodeCount);
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <header style={{ 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Performance Comparison</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Side-by-side comparison of baseline vs optimized implementation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input 
              type="checkbox" 
              checked={syncControls}
              onChange={(e) => setSyncControls(e.target.checked)}
            />
            Sync Controls
          </label>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              padding: '8px 16px', 
              background: '#0066cc', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Overview
          </button>
        </div>
      </header>
      
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fafafa',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        gap: '20px',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ marginRight: '10px' }}>Nodes:</label>
          <select 
            value={nodeCount} 
            onChange={(e) => setNodeCount(Number(e.target.value))}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value={10}>10 nodes</option>
            <option value={100}>100 nodes</option>
            <option value={500}>500 nodes</option>
            <option value={1000}>1,000 nodes</option>
            <option value={5000}>5,000 nodes</option>
            <option value={10000}>10,000 nodes</option>
          </select>
        </div>
        
        <div>
          <label style={{ marginRight: '10px' }}>Layout:</label>
          <select 
            value={layoutType} 
            onChange={(e) => setLayoutType(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="forceDirected2d">Force Directed 2D</option>
            <option value="forceDirected3d">Force Directed 3D</option>
            <option value="circular2d">Circular 2D</option>
            <option value="hierarchicalTd">Hierarchical Top-Down</option>
            <option value="treeTd2d">Tree Top-Down 2D</option>
          </select>
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px', color: '#666' }}>
          <span>Nodes: {nodes.length}</span>
          <span>Edges: {edges.length}</span>
          <span>Layout: {layoutType}</span>
        </div>
      </div>
      
      <main style={{ flex: 1, display: 'flex' }}>
        {/* Baseline Implementation */}
        <div style={{ flex: 1, position: 'relative', borderRight: '1px solid #e0e0e0', paddingBottom: '80px' }}>
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            zIndex: 10,
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            BASELINE
          </div>
          
          <ProfilerWrapper id="baseline-comparison" onRender={(id, phase, duration) => {
            console.log(`Baseline comparison render: ${phase} - ${duration}ms`);
          }}>
            <GraphCanvas 
              nodes={nodes} 
              edges={edges}
              layoutType={layoutType as any}
              theme={lightTheme}
              cameraMode="pan"
            />
          </ProfilerWrapper>
          
          <PerformanceMonitor 
            onMetricsUpdate={setBaselineMetrics}
            implementation="baseline"
            position="bottom-left"
            visible={true}
          />
        </div>
        
        {/* Optimized Implementation */}
        <div style={{ flex: 1, position: 'relative', paddingBottom: '80px' }}>
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(40, 167, 69, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            zIndex: 10,
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            OPTIMIZED
          </div>
          
          <ProfilerWrapper id="optimized-comparison" onRender={(id, phase, duration) => {
            console.log(`Optimized comparison render: ${phase} - ${duration}ms`);
          }}>
            <OptimizedGraphCanvas 
              nodes={nodes} 
              edges={edges}
              layoutType={layoutType as any}
              theme={lightTheme}
              cameraMode="pan"
            />
          </ProfilerWrapper>
          
          <PerformanceMonitor 
            onMetricsUpdate={setOptimizedMetrics}
            implementation="optimized"
            position="bottom-left"
            visible={true}
          />
        </div>
      </main>
    </div>
  );
};