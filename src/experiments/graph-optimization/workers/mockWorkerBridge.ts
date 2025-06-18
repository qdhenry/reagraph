// Mock Worker Bridge for development
// This simulates the Web Worker behavior without actually using workers

export interface LayoutWorkerPayload {
  nodes: any[];
  edges: any[];
  layoutType: string;
  dimensions?: number;
  nodeStrength?: number;
  linkDistance?: number;
}

export interface LayoutWorkerResult {
  nodes: any[];
  duration?: number;
}

class MockWorkerBridge {
  private requestId: number = 0;
  private utilization: number = 0;
  
  async calculateLayout(payload: LayoutWorkerPayload): Promise<LayoutWorkerResult> {
    const startTime = performance.now();
    
    // Simulate worker processing
    this.utilization = 0.75;
    
    // Create a simple circular layout for testing
    const { nodes, layoutType, dimensions = 3 } = payload;
    const radius = 100;
    const angleStep = (2 * Math.PI) / nodes.length;
    
    const layoutNodes = nodes.map((node, index) => {
      const angle = index * angleStep;
      return {
        ...node,
        id: node.id,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        z: dimensions === 3 ? (Math.random() - 0.5) * 50 : 0
      };
    });
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const duration = performance.now() - startTime;
    this.utilization = 0;
    
    return {
      nodes: layoutNodes,
      duration
    };
  }
  
  getWorkerUtilization(): number {
    return this.utilization;
  }
  
  terminate(): void {
    // No-op for mock
  }
}

export const mockWorkerBridge = new MockWorkerBridge();