// Simple test worker
self.addEventListener('message', (event) => {
  console.log('[Test Worker] Received message:', event.data);
  
  // Echo back the message
  self.postMessage({
    type: 'ECHO',
    received: event.data,
    timestamp: Date.now()
  });
});

export {};