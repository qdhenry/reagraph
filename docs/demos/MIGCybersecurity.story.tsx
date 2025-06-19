import React, { useState, useMemo } from 'react';
import { GraphCanvas } from '../../src';
import { Meta, StoryObj } from '@storybook/react';
import migData from '../assets/mig-data.json';
import {
  transformMIGData,
  filterNodesBySeverity,
  createPerformanceStats,
  getThreatColor
} from '../../src/utils/migDataTransform';

const meta: Meta<typeof GraphCanvas> = {
  title: 'Performance/MIG Cybersecurity Visualization',
  component: GraphCanvas,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Real-world cybersecurity threat visualization using MIG data with instanced rendering for optimal performance.'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Transform the MIG data
const { nodes: migNodes, edges: migEdges } = transformMIGData(migData);
const performanceStats = createPerformanceStats(migNodes, migEdges);

export const FullMIGDataset: Story = {
  name: 'Full MIG Dataset - Instanced Rendering',
  args: {
    nodes: migNodes,
    edges: migEdges,
    layoutType: 'forceDirected2d',
    draggable: true,
    useInstancedNodes: true,
    showLabels: true,
    showIcons: true,
    animated: true
  }
};

export const PerformanceComparison: Story = {
  name: 'Performance: Individual vs Instanced',
  render: (args) => {
    const [useInstanced, setUseInstanced] = useState(true);
    
    return (
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <GraphCanvas
          {...args}
          nodes={migNodes}
          edges={migEdges}
          layoutType="forceDirected2d"
          draggable={true}
          useInstancedNodes={useInstanced}
          showLabels={true}
          showIcons={true}
          animated={true}
        />
        
        {/* Performance Controls */}
        <div 
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            minWidth: '300px'
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', color: '#00D4FF' }}>🚀 Performance Mode</h3>
          
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={useInstanced}
              onChange={(e) => setUseInstanced(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Use Instanced Rendering
          </label>
          
          <div style={{ borderTop: '1px solid #333', paddingTop: '10px', marginTop: '10px' }}>
            <div>📊 Services: {performanceStats.totalNodes}</div>
            <div>🔗 Connections: {performanceStats.totalEdges}</div>
            <div>⚠️ Total Threats: {performanceStats.totalThreats}</div>
            <div>🌐 Internet-Facing: {performanceStats.internetFacingServices}</div>
            <div style={{ marginTop: '5px', fontSize: '11px', color: '#888' }}>
              {useInstanced ? '⚡ Instanced (Optimized)' : '🐌 Individual (Standard)'}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export const ThreatSeverityFiltering: Story = {
  name: 'Interactive Threat Filtering',
  render: (args) => {
    const [minSeverity, setMinSeverity] = useState<'critical' | 'high' | 'medium' | 'low' | 'none'>('none');
    
    const filteredNodes = useMemo(() => {
      return filterNodesBySeverity(migNodes, minSeverity);
    }, [minSeverity]);
    
    const filteredEdges = useMemo(() => {
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      return migEdges.filter(edge => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
    }, [filteredNodes]);
    
    return (
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <GraphCanvas
          {...args}
          nodes={filteredNodes}
          edges={filteredEdges}
          layoutType="forceDirected2d"
          draggable={true}
          useInstancedNodes={true}
          showLabels={true}
          showIcons={true}
          animated={true}
        />
        
        {/* Threat Filtering Controls */}
        <div 
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            minWidth: '250px'
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#FF6B6B' }}>⚠️ Threat Filter</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Minimum Severity:
            </label>
            <select
              value={minSeverity}
              onChange={(e) => setMinSeverity(e.target.value as any)}
              style={{
                width: '100%',
                padding: '5px',
                backgroundColor: '#333',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '4px'
              }}
            >
              <option value="none">All Services</option>
              <option value="low">Low & Above</option>
              <option value="medium">Medium & Above</option>
              <option value="high">High & Above</option>
              <option value="critical">Critical Only</option>
            </select>
          </div>
          
          <div style={{ fontSize: '11px' }}>
            <div>🎯 Showing: {filteredNodes.length} / {migNodes.length} services</div>
            <div>🔗 Connections: {filteredEdges.length}</div>
          </div>
          
          {/* Severity Legend */}
          <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
            <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Severity Colors:</div>
            {[
              { level: 'critical', count: performanceStats.threatCounts.critical || 0 },
              { level: 'high', count: performanceStats.threatCounts.high || 0 },
              { level: 'medium', count: performanceStats.threatCounts.medium || 0 },
              { level: 'low', count: performanceStats.threatCounts.low || 0 }
            ].map(({ level, count }) => (
              <div key={level} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '3px' 
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: getThreatColor(level),
                  borderRadius: '2px',
                  marginRight: '8px'
                }} />
                <span style={{ textTransform: 'capitalize' }}>{level}: {count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
};

export const CriticalThreatsOnly: Story = {
  name: 'Critical Threats - High Alert View',
  args: {
    nodes: filterNodesBySeverity(migNodes, 'critical'),
    edges: migEdges.filter(edge => {
      const criticalNodeIds = new Set(filterNodesBySeverity(migNodes, 'critical').map(n => n.id));
      return criticalNodeIds.has(edge.source) && criticalNodeIds.has(edge.target);
    }),
    layoutType: 'forceDirected2d',
    draggable: true,
    useInstancedNodes: true,
    showLabels: true,
    showIcons: true,
    animated: true
  }
};

export const TechnologyStackView: Story = {
  name: 'Technology Stack Visualization',
  render: (args) => {
    const [selectedTech, setSelectedTech] = useState<string>('all');
    
    const techNodes = useMemo(() => {
      if (selectedTech === 'all') return migNodes;
      return migNodes.filter(node => node.data?.iconName === selectedTech);
    }, [selectedTech]);
    
    const techEdges = useMemo(() => {
      const nodeIds = new Set(techNodes.map(n => n.id));
      return migEdges.filter(edge => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
    }, [techNodes]);
    
    const techStats = useMemo(() => {
      const techCounts = migNodes.reduce((counts, node) => {
        const tech = node.data?.iconName || 'unknown';
        counts[tech] = (counts[tech] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      return techCounts;
    }, []);
    
    return (
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <GraphCanvas
          {...args}
          nodes={techNodes}
          edges={techEdges}
          layoutType="forceDirected2d"
          draggable={true}
          useInstancedNodes={true}
          showLabels={true}
          showIcons={true}
          animated={true}
        />
        
        {/* Technology Filter */}
        <div 
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            minWidth: '200px'
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#4ECDC4' }}>💻 Technology Stack</h3>
          
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            style={{
              width: '100%',
              padding: '5px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              marginBottom: '10px'
            }}
          >
            <option value="all">All Technologies</option>
            <option value="java">Java ({techStats.java || 0})</option>
            <option value="dotnet">.NET ({techStats.dotnet || 0})</option>
            <option value="go">Go ({techStats.go || 0})</option>
            <option value="python">Python ({techStats.python || 0})</option>
          </select>
          
          <div style={{ fontSize: '11px' }}>
            <div>🎯 Showing: {techNodes.length} services</div>
            <div>🔗 Connections: {techEdges.length}</div>
          </div>
        </div>
      </div>
    );
  }
};

export const AnimatedThreatIndicators: Story = {
  name: 'Animated Threat Status',
  render: (args) => {
    return (
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <GraphCanvas
          {...args}
          nodes={migNodes}
          edges={migEdges}
          layoutType="forceDirected2d"
          draggable={true}
          useInstancedNodes={true}
          showLabels={true}
          showIcons={true}
          animated={true}
        />
        
        {/* Legend and Instructions */}
        <div 
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            maxWidth: '300px'
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#FFD700' }}>🎯 Live Threat Monitor</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <div>🔴 Critical threats pulse with high intensity</div>
            <div>🟠 High severity threats have medium glow</div>
            <div>🟡 Medium threats show subtle animation</div>
            <div>🟢 Low/No threats remain stable</div>
          </div>
          
          <div style={{ borderTop: '1px solid #333', paddingTop: '10px', fontSize: '11px' }}>
            <div>⚡ Using instanced rendering for smooth animations</div>
            <div>🏷️ Service labels and technology icons visible</div>
            <div>🎮 Drag nodes to explore connections</div>
          </div>
        </div>
        
        {/* Performance Stats */}
        <div 
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        >
          <div>🚀 Instanced Rendering Active</div>
          <div>📊 {performanceStats.totalNodes} nodes, {performanceStats.totalEdges} edges</div>
          <div>⚠️ {performanceStats.totalThreats} total threats detected</div>
          <div>💾 Memory optimized for large datasets</div>
        </div>
      </div>
    );
  }
};