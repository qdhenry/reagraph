// Dynamic GPU.js import to avoid build issues
let GPU: any = null;

export class GpuManager {
  private static instance: GpuManager | null = null;
  private gpu: any = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): GpuManager {
    if (!GpuManager.instance) {
      GpuManager.instance = new GpuManager();
    }
    return GpuManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.loadGPU();
    await this.initPromise;
  }

  private async loadGPU(): Promise<void> {
    try {
      // Try to load GPU.js from CDN
      if (typeof window !== 'undefined' && !GPU) {
        await this.loadScript('https://cdn.jsdelivr.net/npm/gpu.js@2.16.0/dist/gpu-browser.min.js');
        GPU = (window as any).GPU;
      }

      if (!GPU) {
        throw new Error('GPU.js failed to load');
      }

      // Create GPU instance
      this.gpu = new GPU({
        mode: 'gpu', // Try GPU mode first
      });

      // Test if GPU is working
      const testKernel = this.gpu.createKernel(function() {
        return this.thread.x;
      }).setOutput([1]);

      testKernel();
      testKernel.destroy();

      this.isInitialized = true;
      console.log('GPU.js initialized successfully');
    } catch (error) {
      console.warn('GPU initialization failed, falling back to CPU mode:', error);
      
      // Try CPU fallback
      if (GPU) {
        this.gpu = new GPU({ mode: 'cpu' });
        this.isInitialized = true;
      } else {
        throw new Error('GPU.js is not available');
      }
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  getGPU(): any {
    if (!this.isInitialized) {
      throw new Error('GPU not initialized. Call initialize() first.');
    }
    return this.gpu;
  }

  isAvailable(): boolean {
    return this.isInitialized && this.gpu !== null;
  }

  getMode(): string {
    return this.gpu?.mode || 'none';
  }

  destroy(): void {
    if (this.gpu) {
      // Destroy any active kernels if needed
      this.gpu = null;
    }
    this.isInitialized = false;
    GpuManager.instance = null;
  }
}