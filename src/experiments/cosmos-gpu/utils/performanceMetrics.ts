export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  layoutTime: number;
  memoryUsage: number;
  nodeCount: number;
  edgeCount: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private frameTime = 0;
  private renderStart = 0;
  private renderTime = 0;
  private layoutStart = 0;
  private layoutTime = 0;
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;

  startFrame() {
    this.renderStart = performance.now();
  }

  endFrame() {
    const now = performance.now();
    this.renderTime = now - this.renderStart;
    this.frameTime = now - this.renderStart;
    
    this.frameCount++;
    const elapsed = now - this.lastTime;
    
    if (elapsed >= 1000) {
      this.fps = (this.frameCount * 1000) / elapsed;
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  startLayout() {
    this.layoutStart = performance.now();
  }

  endLayout() {
    this.layoutTime = performance.now() - this.layoutStart;
  }

  recordMetrics(nodeCount: number, edgeCount: number) {
    const metrics: PerformanceMetrics = {
      fps: this.fps,
      frameTime: this.frameTime,
      renderTime: this.renderTime,
      layoutTime: this.layoutTime,
      memoryUsage: this.getMemoryUsage(),
      nodeCount,
      edgeCount,
      timestamp: Date.now(),
    };

    this.metrics.push(metrics);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    return metrics;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1048576;
    }
    return 0;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  clear() {
    this.metrics = [];
    this.frameCount = 0;
    this.fps = 0;
  }

  getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;

    const sum = this.metrics.reduce(
      (acc, metric) => ({
        fps: acc.fps + metric.fps,
        frameTime: acc.frameTime + metric.frameTime,
        renderTime: acc.renderTime + metric.renderTime,
        layoutTime: acc.layoutTime + metric.layoutTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        nodeCount: metric.nodeCount,
        edgeCount: metric.edgeCount,
        timestamp: Date.now(),
      }),
      {
        fps: 0,
        frameTime: 0,
        renderTime: 0,
        layoutTime: 0,
        memoryUsage: 0,
        nodeCount: 0,
        edgeCount: 0,
        timestamp: 0,
      }
    );

    const count = this.metrics.length;
    return {
      fps: sum.fps / count,
      frameTime: sum.frameTime / count,
      renderTime: sum.renderTime / count,
      layoutTime: sum.layoutTime / count,
      memoryUsage: sum.memoryUsage / count,
      nodeCount: sum.nodeCount,
      edgeCount: sum.edgeCount,
      timestamp: sum.timestamp,
    };
  }
}