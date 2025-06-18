self.addEventListener("message",e=>{console.log("[Test Worker] Received message:",e.data),self.postMessage({type:"ECHO",received:e.data,timestamp:Date.now()})});
