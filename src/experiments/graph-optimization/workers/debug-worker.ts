// Debug utility to check worker status
export function debugWorkerSetup() {
  console.group('🔍 Worker Setup Debug');
  
  // Check basic Worker support
  console.log('Worker support:', typeof Worker !== 'undefined' ? '✅ Available' : '❌ Not available');
  
  // Check module worker support
  try {
    new Worker('data:,', { type: 'module' });
    console.log('Module workers:', '✅ Supported');
  } catch (e) {
    console.log('Module workers:', '⚠️  Not supported -', e.message);
  }
  
  // Check current URL and worker path
  const currentUrl = window.location.href;
  console.log('Current URL:', currentUrl);
  
  // Check if Vite is handling the worker
  if (import.meta.env.DEV) {
    console.log('Vite dev mode:', '✅ Active');
    console.log('Vite should transform worker imports automatically');
  } else {
    console.log('Vite dev mode:', '❌ Not in dev mode');
  }
  
  // Test different worker import methods
  console.group('Testing Worker Import Methods:');
  
  // Method 1: Direct import with ?worker suffix (Vite way)
  try {
    import('./test.worker.ts?worker').then(WorkerModule => {
      console.log('✅ Method 1 (?worker import): Success');
      const worker = new WorkerModule.default();
      worker.postMessage({ test: 'method1' });
      worker.onmessage = (e) => {
        console.log('Method 1 response:', e.data);
        worker.terminate();
      };
    }).catch(err => {
      console.error('❌ Method 1 (?worker import) failed:', err);
    });
  } catch (e) {
    console.error('❌ Method 1 (?worker import) failed:', e);
  }
  
  // Method 2: URL constructor with import.meta.url
  try {
    const workerUrl = new URL('./layout.worker.ts', import.meta.url);
    console.log('Method 2 URL:', workerUrl.href);
    
    const testWorker = new Worker(workerUrl, { type: 'module' });
    
    testWorker.addEventListener('error', (e) => {
      console.error('❌ Method 2 (URL) error:', e);
    });
    
    testWorker.addEventListener('message', (e) => {
      console.log('✅ Method 2 (URL) response:', e.data);
      testWorker.terminate();
    });
    
    setTimeout(() => {
      console.log('Method 2: Sending test message...');
      testWorker.postMessage({
        type: 'CALCULATE_LAYOUT',
        id: 'test-2',
        payload: {
          nodes: [{ id: 'test', x: 0, y: 0, z: 0 }],
          edges: [],
          layoutType: 'forceDirected3d'
        }
      });
    }, 100);
    
  } catch (error) {
    console.error('❌ Method 2 (URL) failed:', error);
  }
  
  // Method 3: Worker constructor with string path
  try {
    // This typically doesn't work in Vite without proper configuration
    const worker = new Worker('/src/experiments/graph-optimization/workers/test.worker.ts', { type: 'module' });
    worker.onmessage = () => {
      console.log('✅ Method 3 (string path): Success');
      worker.terminate();
    };
    worker.onerror = () => {
      console.log('❌ Method 3 (string path): Failed (expected in Vite)');
      worker.terminate();
    };
    worker.postMessage({ test: 'method3' });
  } catch (e) {
    console.log('❌ Method 3 (string path): Failed (expected in Vite)', e.message);
  }
  
  console.groupEnd();
  console.groupEnd();
}

// Auto-run in development
if (import.meta.env.DEV) {
  setTimeout(debugWorkerSetup, 1000);
}