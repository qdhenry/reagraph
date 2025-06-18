import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptimizedGraphCanvas, OptimizedGraphCanvasRef } from './OptimizedGraphCanvas';
import { lightTheme } from '../../../themes';
import { simpleNodes, simpleEdges } from '../../../../docs/assets/demo';
import { PerformanceMonitor, ProfilerWrapper, metricsRecorder } from '../metrics';
import { debugWorkerSetup } from '../workers/debug-worker';

export const OptimizedPage: React.FC = () => {
  const navigate = useNavigate();
  const [nodeCount, setNodeCount] = useState(100);
  const [layoutType, setLayoutType] = useState<string>('forceDirected2d');
  const [workerStatus, setWorkerStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const graphRef = useRef<OptimizedGraphCanvasRef>(null);
  
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
  
  // Handle metrics updates
  const handleMetricsUpdate = useCallback((metrics: any) => {
    const workerUtilization = graphRef.current?.getWorkerUtilization?.() || 0;
    metricsRecorder.recordSnapshot({
      ...metrics,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      layoutType,
      workerUtilization
    });
  }, [nodes.length, edges.length, layoutType]);
  
  // Start recording when component mounts
  React.useEffect(() => {
    metricsRecorder.startRecording();
    setWorkerStatus('active'); // Mock worker status
    
    // Run debug worker setup
    debugWorkerSetup();
    
    return () => {
      metricsRecorder.stopRecording();
      setWorkerStatus('idle');
    };
  }, []);
  
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
          <h1 style={{ margin: 0, fontSize: '24px' }}>Optimized Implementation</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Web Worker-based graph rendering
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ 
            padding: '4px 12px', 
            background: workerStatus === 'active' ? '#28a745' : '#6c757d',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            Worker: {workerStatus}
          </div>
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
          <span style={{ color: '#28a745' }}>✓ Web Workers Enabled</span>
        </div>
      </div>
      
      <main style={{ flex: 1, position: 'relative', paddingBottom: '80px' }}>
        <ProfilerWrapper id="optimized-graph" onRender={(id, phase, duration) => {
          console.log(`Optimized render: ${phase} - ${duration}ms`);
        }}>
          <OptimizedGraphCanvas 
            ref={graphRef}
            nodes={nodes} 
            edges={edges}
            layoutType={layoutType as any}
            theme={lightTheme}
            cameraMode="pan"
            animated={false}
          />
        </ProfilerWrapper>
        
        <PerformanceMonitor 
          onMetricsUpdate={handleMetricsUpdate}
          implementation="optimized"
          position="bottom-left"
        />
        
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(40, 167, 69, 0.1)',
          border: '1px solid #28a745',
          borderRadius: '4px',
          padding: '10px',
          fontSize: '14px'
        }}>
          <strong>Optimization Status:</strong><br />
          This will use Web Workers for:<br />
          • Layout calculations<br />
          • Node sizing computations<br />
          • Cluster analysis<br />
          • Graph transformations
        </div>
      </main>
    </div>
  );
};