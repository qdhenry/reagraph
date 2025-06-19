# Reagraph Instanced Nodes Analysis

## Project Overview

Reagraph is a high-performance WebGL-based network graph visualization library for React, built on React Three Fiber. The project currently faces performance bottlenecks when rendering large graphs (1000+ nodes) due to individual mesh creation for each node.



### Node Rendering Flow

**Current Implementation:**
```typescript
// GraphScene.tsx - lines 409-446
const nodeComponents = useMemo(
  () =>
    nodes.map(n => (
      <Node
        key={n?.id}
        id={n?.id}
        // ... extensive props
      />
    )),
  [extensive_dependencies]
);
```

**Performance Issues:**
1. Each node creates its own mesh/geometry
2. Individual event handlers for each node
3. Extensive re-renders due to useMemo dependencies
4. High GPU draw calls for large graphs

### Existing Edge Optimization Pattern

The codebase already demonstrates efficient instanced rendering with edges:

**Edge Architecture (`src/symbols/edges/Edges.tsx`):**
```typescript
// Groups edges by state for efficient rendering
const [active, inactive, draggingActive, draggingInactive] = useMemo(() => {
  // Group edges by rendering state
}, [edges, actives, selections, draggingIds]);

// Merge geometries into single meshes
const staticEdgesGeometry = useMemo(
  () => getGeometry(active, inactive),
  [getGeometry, active, inactive]
);
```

**Key Optimizations:**
- Groups edges by visual state (active, inactive, dragging)
- Merges multiple geometries into single meshes
- Reduces draw calls dramatically
- Manual geometry/event management outside React Three Fiber

## Drei Instances Research

### Drei Instances API

**Performance Benefits:**
- Reduces GPU draw calls by rendering multiple similar objects efficiently
- Declarative approach to THREE.InstancedMesh
- Supports hundreds of thousands of objects in single draw call
- Dynamic mounting/unmounting of instances

**Basic Usage Pattern:**
```jsx
<Instances limit={1000}>
  <boxGeometry />
  <meshStandardMaterial />
  <Instance 
    color="red" 
    scale={2} 
    position={[1, 2, 3]} 
  />
</Instances>
```

**Advanced Features:**
- Custom attributes via InstancedAttribute
- Event handling on individual instances
- Typed instances with custom attributes
- Nested coordinate positioning

**Performance Considerations:**
- CPU overhead for declarative component approach
- For extreme performance, direct THREE.InstancedMesh recommended
- Best suited for many similar objects

## Current Node Component Analysis

### Node Component Structure (`src/symbols/Node.tsx`)

**Key Features:**
- Position animations via React Spring
- Event handling (hover, click, drag, context menu)
- Multiple node types (Sphere, Icon, custom renderers)
- Selection states and visual highlighting
- Label rendering and positioning
- Dragging with constraint support

**Props Flow:**
```typescript
export interface NodeProps {
  id: string;
  disabled?: boolean;
  animated?: boolean;
  draggable?: boolean;
  constrainDragging?: boolean;
  labelFontUrl?: string;
  renderNode?: NodeRenderer;
  contextMenu?: (event: ContextMenuEvent) => ReactNode;
  // ... extensive event handlers
}
```

**State Management:**
- Uses Zustand store for global state
- Individual component state for hover/menu
- Position updates through store actions

### Node Renderers (`src/symbols/nodes/`)

**Available Node Types:**
- `Sphere.tsx` - Basic spherical nodes with phong material
- `Icon.tsx` - Nodes with image textures
- `SphereWithIcon.tsx` - Combined sphere + icon
- `SphereWithSvg.tsx` - SVG-based nodes
- `Svg.tsx` - Pure SVG nodes

**Rendering Pattern:**
```typescript
// Sphere.tsx
<a.mesh userData={{ id, type: 'node' }} scale={scale}>
  <sphereGeometry attach="geometry" args={[1, 25, 25]} />
  <a.meshPhongMaterial
    attach="material"
    color={normalizedColor}
    opacity={nodeOpacity}
    // ... material props
  />
</a.mesh>
```

## useGraph Hook Analysis

### Current Implementation Issues

**Performance Concerns in `useGraph.ts`:**
1. **Excessive useEffect hooks** - Multiple effects watching different dependencies
2. **Large dependency arrays** - Effects trigger frequently
3. **Expensive calculations** - Layout updates, visibility calculations
4. **Store updates** - Multiple store actions per update cycle

**Key Performance Hotspots:**
```typescript
// Lines 190-220: Camera-based label visibility updates
useEffect(() => {
  const nodes = stateNodes.map(node => ({
    ...node,
    labelVisible: calcLabelVisibility({...})
  }));
  // Triggers on every camera movement
}, [camera, camera.zoom, camera.position.z, ...]);

// Lines 237-248: Layout updates
useEffect(() => {
  async function update() {
    buildGraph(graph, visibleNodes, visibleEdges);
    await updateLayout();
  }
  update();
}, [visibleNodes, visibleEdges]);
```

## Performance Baseline Requirements

### Metrics to Track
1. **Rendering Performance:**
   - FPS during interaction
   - Frame time consistency
   - GPU draw calls
   - Memory usage

2. **Layout Performance:**
   - Initial layout calculation time
   - Update layout time
   - Worker vs main thread performance

3. **Interaction Performance:**
   - Click/hover response time
   - Drag performance
   - Selection update time

### Test Scenarios
1. **Small Graphs** (10-50 nodes) - Baseline compatibility
2. **Medium Graphs** (100-500 nodes) - Transition threshold
3. **Large Graphs** (1000+ nodes) - Target optimization
4. **Extreme Graphs** (5000+ nodes) - Stress testing

## Implementation Strategy

### Phase 1: Foundation
Based on existing edge optimization patterns:
1. Create InstancedNodes component using drei Instances
2. Group nodes by visual state (active, inactive, selected, dragging)
3. Implement container component for conditional rendering

### Phase 2: Event System
Replicate edge event handling approach:
1. Custom raycasting for instanced nodes
2. Map intersections back to node IDs
3. Maintain all existing event interfaces

### Phase 3: Compatibility
Ensure seamless integration:
1. Support all existing node types
2. Maintain custom renderer support
3. Preserve animation capabilities
4. Keep label rendering functional

### Phase 4: Optimization
Additional performance improvements:
1. useGraph hook optimization
2. Store update efficiency
3. Memory management
4. Worker preparation

## Risk Assessment

### Technical Risks
1. **Event Handling Complexity** - Maintaining fidelity with instanced rendering
2. **Animation Compatibility** - React Spring integration with instances
3. **Custom Renderer Support** - Complex instancing for varied geometries
4. **State Synchronization** - Efficient updates between store and instances

### Mitigation Strategies
1. **Feature Flagging** - Gradual rollout with fallback options
2. **Extensive Testing** - Comprehensive test coverage for all scenarios
3. **Performance Monitoring** - Real-time metrics and regression detection
4. **Documentation** - Clear migration paths and troubleshooting guides

## Success Criteria

### Performance Targets
1. **Large Graph Rendering** - Maintain 60 FPS with 1000+ nodes
2. **Memory Efficiency** - Reduce memory usage by 50%+ for large graphs
3. **Interaction Responsiveness** - Sub-100ms response times for all interactions
4. **Backward Compatibility** - 100% compatibility with existing APIs

### Quality Targets
1. **Test Coverage** - 90%+ coverage for new components
2. **Documentation** - Complete API documentation and examples
3. **Developer Experience** - Seamless migration for existing users
4. **Cross-platform** - Consistent performance across browsers/devices

## Related Resources

### External References
- [Drei Instances Documentation](https://drei.docs.pmnd.rs/performances/instances)
- [Custom Node Example](https://github.com/Monichre/ultraterrestrial/blob/main/src/components/visualizations/graph/rtf-graph.tsx#L162)
- [Drei Performance Guides](https://drei.docs.pmnd.rs/performances/merged)

### Codebase References
- `src/symbols/edges/Edges.tsx` - Existing optimization pattern
- `src/useGraph.ts` - Performance optimization target
- `src/symbols/Node.tsx` - Current node implementation
- `src/symbols/nodes/` - Node renderer variants
- `docs/demos/` - Test scenarios and examples
