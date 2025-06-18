import { WorkerPool } from './WorkerPool';
import { metricsRecorder } from '../metrics';
// Import worker using Vite's ?worker syntax
import LayoutWorker from './layout.worker.ts?worker';

// Create worker URL from source - for fallback
const workerUrl = new URL('./layout.worker.ts', import.meta.url);

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

class WorkerBridge {
  private layoutPool: WorkerPool;
  private requestId: number = 0;
  
  constructor() {
    // Try to use Vite worker constructor first, fallback to URL
    try {
      this.layoutPool = new WorkerPool(() => new LayoutWorker(), 4);
      console.log('WorkerBridge: Using Vite worker constructor');
    } catch (e) {
      console.warn('WorkerBridge: Falling back to URL-based worker', e);
      this.layoutPool = new WorkerPool(workerUrl, 4);
    }
  }
  
  async calculateLayout(payload: LayoutWorkerPayload): Promise<LayoutWorkerResult> {
    const id = `layout-${++this.requestId}`;
    
    // Record layout start
    metricsRecorder.recordLayoutStart();
    
    try {
      const result = await this.layoutPool.execute<LayoutWorkerResult>({
        type: 'CALCULATE_LAYOUT',
        id,
        payload
      });
      
      // Record layout end
      metricsRecorder.recordLayoutEnd(
        payload.nodes.length,
        payload.edges.length,
        payload.layoutType
      );
      
      return result;
    } catch (error) {
      console.error('Layout calculation failed:', error);
      throw error;
    }
  }
  
  getWorkerUtilization(): number {
    return this.layoutPool.getUtilization();
  }
  
  terminate() {
    this.layoutPool.terminate();
  }
}

// Singleton instance
export const workerBridge = new WorkerBridge();