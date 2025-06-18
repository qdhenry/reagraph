export interface PerformanceMetrics {
  // Timing metrics
  layoutCalculationTime: number; // Time to calculate layout in ms
  renderTime: number; // Time to render frame in ms
  totalTime: number; // Total time from start to finish
  
  // Frame rate metrics
  fps: number; // Current frames per second
  minFps: number; // Minimum FPS during session
  maxFps: number; // Maximum FPS during session
  avgFps: number; // Average FPS
  
  // Memory metrics
  memoryUsed: number; // Memory used in MB
  memoryDelta: number; // Change in memory usage
  heapSize: number; // JS heap size in MB
  
  // Thread metrics
  mainThreadBlockingTime: number; // Time main thread is blocked in ms
  workerUtilization?: number; // Percentage of worker utilization (for optimized version)
  
  // Graph metrics
  nodeCount: number;
  edgeCount: number;
  layoutType: string;
  
  // Timestamp
  timestamp: number;
}

export interface MetricsSnapshot {
  baseline?: PerformanceMetrics;
  optimized?: PerformanceMetrics;
  improvement?: {
    layoutTime: number; // Percentage improvement
    fps: number; // Percentage improvement
    memory: number; // Percentage change (can be negative)
    mainThreadBlocking: number; // Percentage improvement
  };
}

export interface BenchmarkConfig {
  nodeCount: number;
  edgeCount: number;
  layoutType: string;
  duration: number; // How long to run the benchmark in ms
  updateFrequency?: number; // How often to update the graph (for dynamic tests)
}

export interface BenchmarkResult {
  config: BenchmarkConfig;
  baseline: PerformanceMetrics[];
  optimized: PerformanceMetrics[];
  summary: {
    avgLayoutTime: { baseline: number; optimized: number };
    avgFps: { baseline: number; optimized: number };
    avgMemory: { baseline: number; optimized: number };
    avgMainThreadBlocking: { baseline: number; optimized: number };
    improvements: {
      layoutTime: number;
      fps: number;
      memory: number;
      mainThreadBlocking: number;
    };
  };
}

export type MetricsEventType = 
  | 'layout-start'
  | 'layout-end'
  | 'render-start'
  | 'render-end'
  | 'frame-update'
  | 'memory-snapshot';

export interface MetricsEvent {
  type: MetricsEventType;
  timestamp: number;
  data?: any;
}