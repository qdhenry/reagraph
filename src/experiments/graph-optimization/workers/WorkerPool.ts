interface WorkerTask {
  id: string;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private taskMap: Map<string, WorkerTask> = new Map();
  private workerTasks: Map<Worker, string> = new Map();
  
  constructor(
    private workerScript: string | URL | (() => Worker),
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    this.initializeWorkers();
  }
  
  private createWorker(): Worker {
    if (typeof this.workerScript === 'function') {
      // Vite worker constructor
      return this.workerScript();
    } else {
      // Traditional URL or string path
      return new Worker(this.workerScript, { type: 'module' });
    }
  }
  
  private initializeWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = this.createWorker();
      
      worker.addEventListener('message', (event) => {
        this.handleWorkerMessage(worker, event);
      });
      
      worker.addEventListener('error', (error) => {
        this.handleWorkerError(worker, error);
      });
      
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }
  
  private handleWorkerMessage(worker: Worker, event: MessageEvent) {
    const taskId = this.workerTasks.get(worker);
    const task = taskId ? this.taskMap.get(taskId) : undefined;
    
    if (task) {
      const { type, payload, error } = event.data;
      
      if (type === 'LAYOUT_COMPLETE' || type === 'LAYOUT_ERROR') {
        // Task completed, resolve or reject
        if (error) {
          task.reject(new Error(error));
        } else {
          task.resolve(payload);
        }
        
        // Clean up
        this.taskMap.delete(taskId);
        this.workerTasks.delete(worker);
        
        // Return worker to pool
        this.availableWorkers.push(worker);
        
        // Process next task if any
        this.processNextTask();
      } else if (type === 'LAYOUT_PROGRESS' && task.resolve) {
        // Send progress updates without completing the task
        // This could be used for streaming updates
        console.log(`Worker progress: ${payload.progress}%`);
      }
    }
  }
  
  private handleWorkerError(worker: Worker, error: ErrorEvent) {
    console.error('Worker error:', error);
    
    const taskId = this.workerTasks.get(worker);
    const task = taskId ? this.taskMap.get(taskId) : undefined;
    
    if (task) {
      task.reject(error);
      this.taskMap.delete(taskId);
      this.workerTasks.delete(worker);
    }
    
    // Try to recover the worker
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      worker.terminate();
      
      // Create a new worker to replace the failed one
      const newWorker = this.createWorker();
      newWorker.addEventListener('message', (event) => {
        this.handleWorkerMessage(newWorker, event);
      });
      newWorker.addEventListener('error', (error) => {
        this.handleWorkerError(newWorker, error);
      });
      
      this.workers[index] = newWorker;
      this.availableWorkers.push(newWorker);
    }
    
    this.processNextTask();
  }
  
  private processNextTask() {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }
    
    const task = this.taskQueue.shift()!;
    const worker = this.availableWorkers.shift()!;
    
    this.workerTasks.set(worker, task.id);
    // Task will be sent by the execute method
  }
  
  execute<T = any>(message: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: message.id,
        resolve,
        reject
      };
      
      this.taskMap.set(task.id, task);
      
      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.shift()!;
        this.workerTasks.set(worker, task.id);
        worker.postMessage(message);
      } else {
        // Queue the task
        this.taskQueue.push(task);
      }
    });
  }
  
  getUtilization(): number {
    const busyWorkers = this.workers.length - this.availableWorkers.length;
    return (busyWorkers / this.workers.length) * 100;
  }
  
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.taskMap.clear();
    this.workerTasks.clear();
  }
}