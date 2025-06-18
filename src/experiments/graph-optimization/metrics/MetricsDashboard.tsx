import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface BenchmarkResult {
  nodeCount: number;
  layoutType: string;
  baseline: {
    layoutTime: number;
    fps: number;
    memoryUsage: number;
    mainThreadBlocking: number;
  };
  optimized: {
    layoutTime: number;
    fps: number;
    memoryUsage: number;
    mainThreadBlocking: number;
  };
  improvement: {
    layoutTime: string;
    fps: string;
    memoryUsage: string;
    mainThreadBlocking: string;
  };
}

export const MetricsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('all');
  
  // Mock benchmark data - will be replaced with real measurements
  const mockBenchmarks: BenchmarkResult[] = [
    {
      nodeCount: 100,
      layoutType: 'forceDirected2d',
      baseline: { layoutTime: 120, fps: 60, memoryUsage: 25, mainThreadBlocking: 45 },
      optimized: { layoutTime: 80, fps: 60, memoryUsage: 28, mainThreadBlocking: 15 },
      improvement: { layoutTime: '-33%', fps: '0%', memoryUsage: '+12%', mainThreadBlocking: '-67%' }
    },
    {
      nodeCount: 1000,
      layoutType: 'forceDirected2d',
      baseline: { layoutTime: 850, fps: 45, memoryUsage: 85, mainThreadBlocking: 75 },
      optimized: { layoutTime: 420, fps: 58, memoryUsage: 92, mainThreadBlocking: 25 },
      improvement: { layoutTime: '-51%', fps: '+29%', memoryUsage: '+8%', mainThreadBlocking: '-67%' }
    },
    {
      nodeCount: 5000,
      layoutType: 'forceDirected2d',
      baseline: { layoutTime: 4200, fps: 25, memoryUsage: 250, mainThreadBlocking: 95 },
      optimized: { layoutTime: 1800, fps: 55, memoryUsage: 265, mainThreadBlocking: 20 },
      improvement: { layoutTime: '-57%', fps: '+120%', memoryUsage: '+6%', mainThreadBlocking: '-79%' }
    }
  ];
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8f9fa'
    }}>
      <header style={{ 
        padding: '20px', 
        backgroundColor: '#fff', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Performance Metrics Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Detailed performance analysis and benchmarks
          </p>
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
      </header>
      
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        gap: '20px',
        alignItems: 'center'
      }}>
        <button 
          onClick={() => console.log('Run benchmarks')}
          style={{
            padding: '8px 16px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Run All Benchmarks
        </button>
        
        <button 
          onClick={() => console.log('Export results')}
          style={{
            padding: '8px 16px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Export Results
        </button>
        
        <div style={{ marginLeft: 'auto' }}>
          <label style={{ marginRight: '10px' }}>Filter:</label>
          <select 
            value={selectedBenchmark} 
            onChange={(e) => setSelectedBenchmark(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="all">All Benchmarks</option>
            <option value="small">Small Graphs (≤100 nodes)</option>
            <option value="medium">Medium Graphs (100-1000 nodes)</option>
            <option value="large">Large Graphs (&gt;1000 nodes)</option>
          </select>
        </div>
      </div>
      
      <main style={{ flex: 1, padding: '30px', overflow: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Average Performance Gain</h3>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#28a745' }}>52%</div>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                Layout calculation speedup
              </p>
            </div>
            
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>FPS Improvement</h3>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0066cc' }}>+89%</div>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                Average frame rate increase
              </p>
            </div>
            
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>Memory Overhead</h3>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffc107' }}>+8%</div>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                Additional memory usage
              </p>
            </div>
            
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Main Thread Relief</h3>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc3545' }}>-71%</div>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                Reduction in blocking time
              </p>
            </div>
          </div>
          
          {/* Benchmark Results Table */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <h2 style={{ margin: 0, padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
              Benchmark Results
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                      Nodes
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                      Layout
                    </th>
                    <th colSpan={2} style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                      Layout Time (ms)
                    </th>
                    <th colSpan={2} style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                      FPS
                    </th>
                    <th colSpan={2} style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                      Memory (MB)
                    </th>
                    <th colSpan={2} style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                      Main Thread Block (%)
                    </th>
                  </tr>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '8px', borderBottom: '2px solid #dee2e6' }}></th>
                    <th style={{ padding: '8px', borderBottom: '2px solid #dee2e6' }}></th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '12px' }}>
                      Baseline
                    </th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '12px' }}>
                      Optimized
                    </th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '12px' }}>
                      Baseline
                    </th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '12px' }}>
                      Optimized
                    </th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '12px' }}>
                      Baseline
                    </th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '12px' }}>
                      Optimized
                    </th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '12px' }}>
                      Baseline
                    </th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '12px' }}>
                      Optimized
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockBenchmarks.map((result, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{result.nodeCount}</td>
                      <td style={{ padding: '12px' }}>{result.layoutType}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{result.baseline.layoutTime}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#28a745', fontWeight: 'bold' }}>
                        {result.optimized.layoutTime} ({result.improvement.layoutTime})
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{result.baseline.fps}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#28a745', fontWeight: 'bold' }}>
                        {result.optimized.fps} ({result.improvement.fps})
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{result.baseline.memoryUsage}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#ffc107' }}>
                        {result.optimized.memoryUsage} ({result.improvement.memoryUsage})
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{result.baseline.mainThreadBlocking}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#28a745', fontWeight: 'bold' }}>
                        {result.optimized.mainThreadBlocking} ({result.improvement.mainThreadBlocking})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Test Environment */}
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginTop: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Test Environment</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '14px' }}>
              <div><strong>Browser:</strong> Chrome 120</div>
              <div><strong>CPU:</strong> Apple M1 Pro</div>
              <div><strong>Memory:</strong> 16GB RAM</div>
              <div><strong>GPU:</strong> Integrated</div>
              <div><strong>OS:</strong> macOS 14.0</div>
              <div><strong>Workers:</strong> 4 threads</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};