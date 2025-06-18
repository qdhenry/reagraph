import { PerformanceMetrics, MetricsEvent, BenchmarkResult, BenchmarkConfig } from './types';

export class MetricsRecorder {
  private metrics: PerformanceMetrics[] = [];
  private events: MetricsEvent[] = [];
  private startTime: number = 0;
  private isRecording: boolean = false;
  private layoutStartTime: number = 0;
  private renderStartTime: number = 0;
  
  // Performance observer for long tasks
  private observer?: PerformanceObserver;
  private mainThreadBlockingTime: number = 0;
  
  constructor() {
    this.setupPerformanceObserver();
  }
  
  private setupPerformanceObserver() {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              this.mainThreadBlockingTime += entry.duration;
            }
          }
        });
        this.observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('PerformanceObserver not supported:', e);
      }
    }
  }
  
  startRecording() {
    this.isRecording = true;
    this.startTime = performance.now();
    this.metrics = [];
    this.events = [];
    this.mainThreadBlockingTime = 0;
  }
  
  stopRecording(): PerformanceMetrics[] {
    this.isRecording = false;
    return this.metrics;
  }
  
  recordLayoutStart() {
    if (!this.isRecording) return;
    
    this.layoutStartTime = performance.now();
    this.recordEvent({
      type: 'layout-start',
      timestamp: this.layoutStartTime
    });
  }
  
  recordLayoutEnd(nodeCount: number, edgeCount: number, layoutType: string) {
    if (!this.isRecording || !this.layoutStartTime) return;
    
    const layoutTime = performance.now() - this.layoutStartTime;
    this.recordEvent({
      type: 'layout-end',
      timestamp: performance.now(),
      data: { duration: layoutTime, nodeCount, edgeCount, layoutType }
    });
    
    // Dispatch custom event for PerformanceMonitor
    window.dispatchEvent(new CustomEvent('graph-layout-time', {
      detail: { duration: layoutTime }
    }));
  }
  
  recordRenderStart() {
    if (!this.isRecording) return;
    
    this.renderStartTime = performance.now();
    this.recordEvent({
      type: 'render-start',
      timestamp: this.renderStartTime
    });
  }
  
  recordRenderEnd() {
    if (!this.isRecording || !this.renderStartTime) return;
    
    const renderTime = performance.now() - this.renderStartTime;
    this.recordEvent({
      type: 'render-end',
      timestamp: performance.now(),
      data: { duration: renderTime }
    });
  }
  
  recordFrame(fps: number, memoryUsed: number) {
    if (!this.isRecording) return;
    
    this.recordEvent({
      type: 'frame-update',
      timestamp: performance.now(),
      data: { fps, memoryUsed }
    });
  }
  
  recordSnapshot(metrics: Partial<PerformanceMetrics>) {
    if (!this.isRecording) return;
    
    const snapshot: PerformanceMetrics = {
      layoutCalculationTime: metrics.layoutCalculationTime || 0,
      renderTime: metrics.renderTime || 0,
      totalTime: performance.now() - this.startTime,
      fps: metrics.fps || 0,
      minFps: Math.min(...this.metrics.map(m => m.fps).filter(Boolean), metrics.fps || 60),
      maxFps: Math.max(...this.metrics.map(m => m.fps).filter(Boolean), metrics.fps || 0),
      avgFps: this.calculateAverageFps(),
      memoryUsed: metrics.memoryUsed || 0,
      memoryDelta: this.calculateMemoryDelta(metrics.memoryUsed || 0),
      heapSize: metrics.heapSize || 0,
      mainThreadBlockingTime: this.mainThreadBlockingTime,
      workerUtilization: metrics.workerUtilization,
      nodeCount: metrics.nodeCount || 0,
      edgeCount: metrics.edgeCount || 0,
      layoutType: metrics.layoutType || '',
      timestamp: performance.now()
    };
    
    this.metrics.push(snapshot);
    
    // Dispatch main thread blocking time
    window.dispatchEvent(new CustomEvent('main-thread-blocking', {
      detail: { duration: this.mainThreadBlockingTime }
    }));
  }
  
  private recordEvent(event: MetricsEvent) {
    this.events.push(event);
  }
  
  private calculateAverageFps(): number {
    const fpsValues = this.metrics.map(m => m.fps).filter(Boolean);
    if (fpsValues.length === 0) return 0;
    return fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
  }
  
  private calculateMemoryDelta(currentMemory: number): number {
    if (this.metrics.length === 0) return 0;
    const firstMemory = this.metrics[0].memoryUsed;
    return currentMemory - firstMemory;
  }
  
  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }
  
  getEvents(): MetricsEvent[] {
    return this.events;
  }
  
  getSummary(): BenchmarkResult['summary'] {
    const layoutTimes = this.metrics.map(m => m.layoutCalculationTime).filter(Boolean);
    const fpsValues = this.metrics.map(m => m.fps).filter(Boolean);
    const memoryValues = this.metrics.map(m => m.memoryUsed).filter(Boolean);
    const blockingTimes = this.metrics.map(m => m.mainThreadBlockingTime).filter(Boolean);
    
    const avg = (arr: number[]) => arr.length > 0 
      ? arr.reduce((a, b) => a + b, 0) / arr.length 
      : 0;
    
    return {
      avgLayoutTime: { 
        baseline: avg(layoutTimes), 
        optimized: 0 // Will be filled by comparison
      },
      avgFps: { 
        baseline: avg(fpsValues), 
        optimized: 0 
      },
      avgMemory: { 
        baseline: avg(memoryValues), 
        optimized: 0 
      },
      avgMainThreadBlocking: { 
        baseline: avg(blockingTimes), 
        optimized: 0 
      },
      improvements: {
        layoutTime: 0,
        fps: 0,
        memory: 0,
        mainThreadBlocking: 0
      }
    };
  }
  
  clear() {
    this.metrics = [];
    this.events = [];
    this.mainThreadBlockingTime = 0;
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Singleton instance for easy access
export const metricsRecorder = new MetricsRecorder();