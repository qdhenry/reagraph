import React, { useState, useEffect, useRef } from 'react';
import { GraphCanvas } from '../../../GraphCanvas';
import { GpuGraphCanvas } from '../components/GpuGraphCanvas';

interface PerformanceMetrics {
  layoutTime: number;
  fps: number;
  frameCount: number;
}

export const PerformanceComparison: React.FC = () => {
  const [nodeCount, setNodeCount] = useState(200);
  const [graphData, setGraphData] = useState(() => generateGraph(200));
  const [cpuMetrics, setCpuMetrics] = useState<PerformanceMetrics>({ layoutTime: 0, fps: 0, frameCount: 0 });
  const [gpuMetrics, setGpuMetrics] = useState<PerformanceMetrics>({ layoutTime: 0, fps: 0, frameCount: 0 });
  
  const cpuStartTime = useRef<number>(0);
  const gpuStartTime = useRef<number>(0);
  const cpuFrameCount = useRef<number>(0);
  const gpuFrameCount = useRef<number>(0);

  function generateGraph(count: number) {
    const nodes = [];
    const edges = [];
    
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: `n${i}`,
        label: `${i}`,
        fill: `hsl(${(i * 137.5) % 360}, 70%, 50%)`
      });
    }
    
    // Create a more realistic graph structure
    for (let i = 0; i < count * 2; i++) {
      const source = Math.floor(Math.random() * count);
      let target = Math.floor(Math.random() * count);
      while (target === source) {
        target = Math.floor(Math.random() * count);
      }
      
      edges.push({
        id: `e${i}`,
        source: `n${source}`,
        target: `n${target}`
      });
    }
    
    return { nodes, edges };
  }

  const handleNodeCountChange = (count: number) => {
    setNodeCount(count);
    setGraphData(generateGraph(count));
    
    // Reset metrics
    setCpuMetrics({ layoutTime: 0, fps: 0, frameCount: 0 });
    setGpuMetrics({ layoutTime: 0, fps: 0, frameCount: 0 });
    cpuStartTime.current = performance.now();
    gpuStartTime.current = performance.now();
    cpuFrameCount.current = 0;
    gpuFrameCount.current = 0;
  };

  // Track FPS
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = (timestamp: number) => {
      frames++;
      
      if (timestamp - lastTime >= 1000) {
        const fps = (frames * 1000) / (timestamp - lastTime);
        
        // Update both CPU and GPU frame counts (in real app, these would be separate)
        cpuFrameCount.current++;
        gpuFrameCount.current++;
        
        if (cpuStartTime.current > 0 && cpuFrameCount.current > 0) {
          const elapsed = (performance.now() - cpuStartTime.current) / 1000;
          setCpuMetrics(prev => ({ 
            ...prev, 
            fps: Math.round(fps),
            frameCount: cpuFrameCount.current,
            layoutTime: elapsed
          }));
        }
        
        if (gpuStartTime.current > 0 && gpuFrameCount.current > 0) {
          const elapsed = (performance.now() - gpuStartTime.current) / 1000;
          setGpuMetrics(prev => ({ 
            ...prev, 
            fps: Math.round(fps),
            frameCount: gpuFrameCount.current,
            layoutTime: elapsed
          }));
        }
        
        frames = 0;
        lastTime = timestamp;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#f5f5f5' }}>
      <div style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>Performance Comparison</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label>
            Node Count: {nodeCount}
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={nodeCount}
              onChange={(e) => handleNodeCountChange(Number(e.target.value))}
              style={{ display: 'block', width: '300px', marginTop: '4px' }}
            />
          </label>
        </div>
        
        <div style={{ display: 'flex', gap: '40px' }}>
          <div>
            <h4>CPU (Standard)</h4>
            <div>FPS: {cpuMetrics.fps}</div>
            <div>Layout Time: {cpuMetrics.layoutTime.toFixed(2)}s</div>
          </div>
          
          <div>
            <h4>GPU (GPU.js)</h4>
            <div>FPS: {gpuMetrics.fps}</div>
            <div>Layout Time: {gpuMetrics.layoutTime.toFixed(2)}s</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: '#dc3545',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            CPU Rendering
          </div>
          <GraphCanvas
            nodes={graphData.nodes}
            edges={graphData.edges}
            layoutType="forceDirected"
            animated={false}
            edgeArrowPosition="none"
            minNodeSize={2}
            maxNodeSize={8}
          />
        </div>
        
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: '#28a745',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            GPU Rendering
          </div>
          <GpuGraphCanvas
            nodes={graphData.nodes}
            edges={graphData.edges}
            useGpuLayout={true}
            animated={false}
            edgeArrowPosition="none"
            minNodeSize={2}
            maxNodeSize={8}
          />
        </div>
      </div>
    </div>
  );
};