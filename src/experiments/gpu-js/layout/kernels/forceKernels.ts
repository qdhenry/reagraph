import { GpuManager } from '../../utils/gpuManager';

export class ForceKernels {
  private gpu: any;
  private manyBodyKernel: any;
  private linkForceKernel: any;
  private integrateKernel: any;
  private centerForceKernel: any;

  constructor() {
    const manager = GpuManager.getInstance();
    this.gpu = manager.getGPU();
    this.initializeKernels();
  }

  private initializeKernels() {
    // Many-body force calculation (repulsion between all nodes)
    this.manyBodyKernel = this.gpu.createKernel(function(
      posX: number[],
      posY: number[],
      posZ: number[],
      nodeStrength: number[],
      alpha: number,
      theta: number
    ) {
      const i = this.thread.x;
      const nodeCount = this.output.x;
      
      let forceX = 0;
      let forceY = 0;
      let forceZ = 0;
      
      const xi = posX[i];
      const yi = posY[i];
      const zi = posZ[i];
      const si = nodeStrength[i];
      
      for (let j = 0; j < nodeCount; j++) {
        if (i !== j) {
          const dx = xi - posX[j];
          const dy = yi - posY[j];
          const dz = zi - posZ[j];
          
          const distSq = dx * dx + dy * dy + dz * dz + 0.0001; // Small epsilon to avoid division by zero
          const dist = Math.sqrt(distSq);
          
          // Barnes-Hut approximation would go here for O(n log n)
          // For now, using direct calculation
          const force = (si * nodeStrength[j] * alpha) / distSq;
          
          forceX += force * (dx / dist);
          forceY += force * (dy / dist);
          forceZ += force * (dz / dist);
        }
      }
      
      return [forceX, forceY, forceZ];
    }).setOutput([1])
      .setPipeline(true);

    // Link force calculation (attraction between connected nodes)
    this.linkForceKernel = this.gpu.createKernel(function(
      posX: number[],
      posY: number[],
      posZ: number[],
      links: number[][],
      linkStrength: number[],
      linkDistance: number[],
      alpha: number
    ) {
      const nodeId = this.thread.x;
      const linkCount = this.constants.linkCount as number;
      
      let forceX = 0;
      let forceY = 0;
      let forceZ = 0;
      
      for (let l = 0; l < linkCount; l++) {
        const source = links[l][0];
        const target = links[l][1];
        
        if (source === nodeId || target === nodeId) {
          const other = source === nodeId ? target : source;
          
          const dx = posX[other] - posX[nodeId];
          const dy = posY[other] - posY[nodeId];
          const dz = posZ[other] - posZ[nodeId];
          
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz + 0.0001);
          const force = (dist - linkDistance[l]) * linkStrength[l] * alpha;
          
          forceX += force * (dx / dist);
          forceY += force * (dy / dist);
          forceZ += force * (dz / dist);
        }
      }
      
      return [forceX, forceY, forceZ];
    }).setOutput([1])
      .setPipeline(true);

    // Center force (attraction to center)
    this.centerForceKernel = this.gpu.createKernel(function(
      posX: number[],
      posY: number[],
      posZ: number[],
      centerX: number,
      centerY: number,
      centerZ: number,
      strength: number
    ) {
      const i = this.thread.x;
      
      const dx = centerX - posX[i];
      const dy = centerY - posY[i];
      const dz = centerZ - posZ[i];
      
      return [
        dx * strength,
        dy * strength,
        dz * strength
      ];
    }).setOutput([1])
      .setPipeline(true);

    // Position integration (update positions based on forces)
    this.integrateKernel = this.gpu.createKernel(function(
      posX: number[],
      posY: number[],
      posZ: number[],
      velX: number[],
      velY: number[],
      velZ: number[],
      forceX: number[],
      forceY: number[],
      forceZ: number[],
      velocityDecay: number
    ) {
      const i = this.thread.x;
      
      // Update velocity with damping
      const vx = (velX[i] + forceX[i]) * velocityDecay;
      const vy = (velY[i] + forceY[i]) * velocityDecay;
      const vz = (velZ[i] + forceZ[i]) * velocityDecay;
      
      // Update position
      const px = posX[i] + vx;
      const py = posY[i] + vy;
      const pz = posZ[i] + vz;
      
      return [px, py, pz, vx, vy, vz];
    }).setOutput([1])
      .setPipeline(true);
  }

  calculateManyBodyForces(
    positions: { x: Float32Array; y: Float32Array; z: Float32Array },
    nodeStrength: Float32Array,
    alpha: number,
    theta: number = 0.9
  ): { x: Float32Array; y: Float32Array; z: Float32Array } {
    const nodeCount = positions.x.length;
    
    this.manyBodyKernel.setOutput([nodeCount]);
    
    const forces: number[][][] = [];
    for (let i = 0; i < nodeCount; i++) {
      const force = this.manyBodyKernel(
        positions.x,
        positions.y,
        positions.z,
        nodeStrength,
        alpha,
        theta
      );
      forces.push(force);
    }
    
    // Extract forces
    const forceX = new Float32Array(nodeCount);
    const forceY = new Float32Array(nodeCount);
    const forceZ = new Float32Array(nodeCount);
    
    for (let i = 0; i < nodeCount; i++) {
      forceX[i] = forces[i][0][0];
      forceY[i] = forces[i][0][1];
      forceZ[i] = forces[i][0][2];
    }
    
    return { x: forceX, y: forceY, z: forceZ };
  }

  calculateLinkForces(
    positions: { x: Float32Array; y: Float32Array; z: Float32Array },
    links: number[][],
    linkStrength: Float32Array,
    linkDistance: Float32Array,
    alpha: number
  ): { x: Float32Array; y: Float32Array; z: Float32Array } {
    const nodeCount = positions.x.length;
    
    this.linkForceKernel.setOutput([nodeCount]);
    this.linkForceKernel.setConstants({ linkCount: links.length });
    
    const forces: number[][][] = [];
    for (let i = 0; i < nodeCount; i++) {
      const force = this.linkForceKernel(
        positions.x,
        positions.y,
        positions.z,
        links,
        linkStrength,
        linkDistance,
        alpha
      );
      forces.push(force);
    }
    
    // Extract forces
    const forceX = new Float32Array(nodeCount);
    const forceY = new Float32Array(nodeCount);
    const forceZ = new Float32Array(nodeCount);
    
    for (let i = 0; i < nodeCount; i++) {
      forceX[i] = forces[i][0][0];
      forceY[i] = forces[i][0][1];
      forceZ[i] = forces[i][0][2];
    }
    
    return { x: forceX, y: forceY, z: forceZ };
  }

  calculateCenterForce(
    positions: { x: Float32Array; y: Float32Array; z: Float32Array },
    center: { x: number; y: number; z: number },
    strength: number
  ): { x: Float32Array; y: Float32Array; z: Float32Array } {
    const nodeCount = positions.x.length;
    
    this.centerForceKernel.setOutput([nodeCount]);
    
    const forces: number[][][] = [];
    for (let i = 0; i < nodeCount; i++) {
      const force = this.centerForceKernel(
        positions.x,
        positions.y,
        positions.z,
        center.x,
        center.y,
        center.z,
        strength
      );
      forces.push(force);
    }
    
    // Extract forces
    const forceX = new Float32Array(nodeCount);
    const forceY = new Float32Array(nodeCount);
    const forceZ = new Float32Array(nodeCount);
    
    for (let i = 0; i < nodeCount; i++) {
      forceX[i] = forces[i][0][0];
      forceY[i] = forces[i][0][1];
      forceZ[i] = forces[i][0][2];
    }
    
    return { x: forceX, y: forceY, z: forceZ };
  }

  integrate(
    positions: { x: Float32Array; y: Float32Array; z: Float32Array },
    velocities: { x: Float32Array; y: Float32Array; z: Float32Array },
    forces: { x: Float32Array; y: Float32Array; z: Float32Array },
    velocityDecay: number
  ): {
    positions: { x: Float32Array; y: Float32Array; z: Float32Array };
    velocities: { x: Float32Array; y: Float32Array; z: Float32Array };
  } {
    const nodeCount = positions.x.length;
    
    this.integrateKernel.setOutput([nodeCount]);
    
    const results: number[][][] = [];
    for (let i = 0; i < nodeCount; i++) {
      const result = this.integrateKernel(
        positions.x,
        positions.y,
        positions.z,
        velocities.x,
        velocities.y,
        velocities.z,
        forces.x,
        forces.y,
        forces.z,
        velocityDecay
      );
      results.push(result);
    }
    
    // Extract updated positions and velocities
    const newPosX = new Float32Array(nodeCount);
    const newPosY = new Float32Array(nodeCount);
    const newPosZ = new Float32Array(nodeCount);
    const newVelX = new Float32Array(nodeCount);
    const newVelY = new Float32Array(nodeCount);
    const newVelZ = new Float32Array(nodeCount);
    
    for (let i = 0; i < nodeCount; i++) {
      newPosX[i] = results[i][0][0];
      newPosY[i] = results[i][0][1];
      newPosZ[i] = results[i][0][2];
      newVelX[i] = results[i][0][3];
      newVelY[i] = results[i][0][4];
      newVelZ[i] = results[i][0][5];
    }
    
    return {
      positions: { x: newPosX, y: newPosY, z: newPosZ },
      velocities: { x: newVelX, y: newVelY, z: newVelZ }
    };
  }

  destroy() {
    if (this.manyBodyKernel) this.manyBodyKernel.destroy();
    if (this.linkForceKernel) this.linkForceKernel.destroy();
    if (this.integrateKernel) this.integrateKernel.destroy();
    if (this.centerForceKernel) this.centerForceKernel.destroy();
  }
}