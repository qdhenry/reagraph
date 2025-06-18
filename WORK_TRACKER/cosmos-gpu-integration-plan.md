# Cosmos GPU Integration Plan

## Overview
Implement a hybrid approach using cosmosgl/graph for GPU-accelerated layout calculations while maintaining React Three Fiber for rendering.

## Directory Structure
```
src/experiments/
├── cosmos-gpu/
│   ├── index.tsx                    # Main experiment entry
│   ├── CosmosGpuPage.tsx           # Main page component
│   ├── comparison/
│   │   └── ComparisonDashboard.tsx # Compare CPU vs GPU performance
│   ├── components/
│   │   ├── CosmosGraphCanvas.tsx   # Main canvas wrapper
│   │   ├── CosmosGraphScene.tsx    # Scene that uses cosmos for layout
│   │   └── CosmosRenderer.tsx      # Handles cosmos integration
│   ├── layout/
│   │   ├── cosmosAdapter.ts        # Adapter between Graphology and Cosmos
│   │   ├── gpuForceDirected.ts     # GPU-accelerated layout implementation
│   │   └── cosmosLayoutProvider.ts # Layout provider registration
│   ├── hooks/
│   │   ├── useCosmosGraph.ts       # Hook for cosmos graph instance
│   │   └── useCosmosSync.ts        # Hook for syncing positions
│   └── utils/
│       ├── dataConverters.ts       # Convert between data formats
│       └── performanceMetrics.ts   # Track GPU vs CPU performance
```

## Implementation Steps

### 1. Install Dependencies
- Add `@cosmos.gl/graph` to package.json

### 2. Create Cosmos Adapter Layer
- Initialize hidden canvas for cosmos rendering
- Convert Graphology graph to cosmos format
- Handle bidirectional position syncing
- Manage cosmos lifecycle

### 3. Implement GPU-Accelerated Layout
- Implement `LayoutStrategy` interface
- Use cosmos for physics simulation
- Extract positions back to Three.js coordinates
- Handle dragging constraints

### 4. Create CosmosGraphCanvas Component
- Extend existing GraphCanvas
- Initialize cosmos context
- Pass cosmos-specific layout provider

### 5. Build CosmosGraphScene Component
- Fork GraphScene to use cosmos positions
- Sync Three.js object positions with cosmos
- Handle interactions (drag, hover, select)

### 6. Add Performance Comparison Tools
- Side-by-side CPU vs GPU rendering
- FPS counter and performance metrics
- Node/edge count stress tests

### 7. Update Router
- Add routes for cosmos experiment
- Include in navigation

## Key Components

### CosmosAdapter
- Manages cosmos graph instance
- Converts between Graphology and cosmos data formats
- Syncs positions between GPU and CPU
- Handles node pinning for dragging

### gpuForceDirected Layout
- Implements LayoutStrategy interface
- Uses cosmos for force calculations
- Returns positions compatible with Three.js

### CosmosGraphCanvas
- Wrapper component that provides cosmos context
- Manages cosmos lifecycle
- Passes layout provider to children

## Benefits
1. **GPU Acceleration**: Leverage GPU for physics calculations
2. **Compatibility**: Maintains existing React Three Fiber rendering
3. **Progressive Enhancement**: Can be adopted incrementally
4. **Isolated Development**: Experiments folder keeps it separate

## Performance Targets
- Handle 10,000+ nodes smoothly
- 60 FPS during layout calculations
- Sub-second initial layout for large graphs

## Next Steps After Implementation
1. Performance benchmarking against CPU implementation
2. Feature parity validation
3. Integration path to main codebase if successful