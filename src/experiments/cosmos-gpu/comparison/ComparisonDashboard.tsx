import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraphCanvas } from '../../../GraphCanvas';
import { CosmosGraphCanvas } from '../components/CosmosGraphCanvas';
import { lightTheme } from '../../../themes';
import { PerformanceMonitor, PerformanceMetrics } from '../utils/performanceMetrics';
import { simpleNodes, simpleEdges, complexNodes, complexEdges } from '../../../../docs/assets/demo';

interface MetricsDisplayProps {
  title: string;
  metrics: PerformanceMetrics | null;
  color: string;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ title, metrics, color }) => {
  if (!metrics) return null;

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      border: `2px solid ${color}`,
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', color }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
        <div>FPS: <strong>{metrics.fps.toFixed(1)}</strong></div>
        <div>Frame Time: <strong>{metrics.frameTime.toFixed(2)}ms</strong></div>
        <div>Render Time: <strong>{metrics.renderTime.toFixed(2)}ms</strong></div>
        <div>Layout Time: <strong>{metrics.layoutTime.toFixed(2)}ms</strong></div>
        <div>Memory: <strong>{metrics.memoryUsage.toFixed(1)}MB</strong></div>
        <div>Nodes: <strong>{metrics.nodeCount}</strong> / Edges: <strong>{metrics.edgeCount}</strong></div>
      </div>
    </div>
  );
};

export function ComparisonDashboard() {
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<'simple' | 'complex'>('simple');
  const [cpuMetrics, setCpuMetrics] = useState<PerformanceMetrics | null>(null);
  const [gpuMetrics, setGpuMetrics] = useState<PerformanceMetrics | null>(null);
  const cpuMonitor = useRef(new PerformanceMonitor());
  const gpuMonitor = useRef(new PerformanceMonitor());

  const data = dataset === 'simple' 
    ? { nodes: simpleNodes, edges: simpleEdges }
    : { nodes: complexNodes, edges: complexEdges };

  useEffect(() => {
    const interval = setInterval(() => {
      const cpuLatest = cpuMonitor.current.getLatestMetrics();
      const gpuLatest = gpuMonitor.current.getLatestMetrics();
      
      if (cpuLatest) setCpuMetrics(cpuLatest);
      if (gpuLatest) setGpuMetrics(gpuLatest);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const recordCpuMetrics = () => {
    cpuMonitor.current.recordMetrics(data.nodes.length, data.edges.length);
  };

  const recordGpuMetrics = () => {
    gpuMonitor.current.recordMetrics(data.nodes.length, data.edges.length);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #e0e0e0', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem' 
      }}>
        <button onClick={() => navigate('/experiments')} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          ← Back to Experiments
        </button>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>CPU vs GPU Performance Comparison</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label>
            Dataset:
            <select 
              value={dataset} 
              onChange={(e) => setDataset(e.target.value as 'simple' | 'complex')}
              style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
            >
              <option value="simple">Simple (Few nodes)</option>
              <option value="complex">Complex (Many nodes)</option>
            </select>
          </label>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <MetricsDisplay title="CPU Performance" metrics={cpuMetrics} color="#3b82f6" />
          <div style={{ flex: 1, border: '2px solid #3b82f6', borderRadius: '4px', overflow: 'hidden' }}>
            <GraphCanvas
              nodes={data.nodes}
              edges={data.edges}
              theme={lightTheme}
              layoutType="forceDirected2d"
              defaultNodeSize={7}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <MetricsDisplay title="GPU Performance" metrics={gpuMetrics} color="#10b981" />
          <div style={{ flex: 1, border: '2px solid #10b981', borderRadius: '4px', overflow: 'hidden' }}>
            <CosmosGraphCanvas
              nodes={data.nodes}
              edges={data.edges}
              theme={lightTheme}
              layoutType="custom"
              defaultNodeSize={7}
            />
          </div>
        </div>
      </div>

      {cpuMetrics && gpuMetrics && (
        <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0', backgroundColor: '#f9fafb' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Performance Summary</h3>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
            <div>
              FPS Improvement: <strong style={{ color: '#10b981' }}>
                {((gpuMetrics.fps / cpuMetrics.fps - 1) * 100).toFixed(1)}%
              </strong>
            </div>
            <div>
              Frame Time Reduction: <strong style={{ color: '#10b981' }}>
                {((1 - gpuMetrics.frameTime / cpuMetrics.frameTime) * 100).toFixed(1)}%
              </strong>
            </div>
            <div>
              Layout Time Reduction: <strong style={{ color: '#10b981' }}>
                {((1 - gpuMetrics.layoutTime / cpuMetrics.layoutTime) * 100).toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}