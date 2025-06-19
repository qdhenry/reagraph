# InstancedNodes Dragging Fix & Performance Optimization Plan

## 🔍 Root Cause Analysis

**The Problem:**
- In `InstancedNodes.tsx`, event handlers are placed on the parent `<Instances>` component
- Complex custom raycasting logic tries to manually determine which instance was clicked 
- The `useDrag` binding is conditionally applied to the entire `<Instances>` component
- This results in unreliable event targeting where wrong nodes get dragged

**The Working Pattern** (from `Node.tsx`):
- Event handlers are placed directly on individual node components
- `useDrag` binding is spread directly onto each node (`{...bind()}`)
- No complex raycasting needed - React Three Fiber handles targeting automatically

**According to drei docs:**
> Events can be defined directly on each `<Instance>` component

The current approach violates this pattern, causing the inconsistent behavior.

## 🎯 Comprehensive Solution Plan

### Phase 1: Fix Dragging Behavior ⚡ (HIGH PRIORITY)

**Problem:** Manual raycasting is unreliable and causes wrong nodes to drag
**Solution:** Move to individual instance event handling

1. **Remove parent-level event handlers** from `<Instances>` component
2. **Add individual event handlers** to each `<Instance>` component  
3. **Implement per-instance drag binding** using individual `useDrag` hooks
4. **Remove complex raycasting logic** since drei handles this automatically
5. **Simplify state management** to track dragged instances directly

### Phase 2: Performance Optimizations 🚀 (MEDIUM PRIORITY)

**2A. Implement Segments for Edge Rendering**
- Replace current edge rendering with drei's `Segments` component
- Performance benefit: "thousands of segments under the same geometry"
- Expected improvement: Significant reduction in draw calls for graphs with many edges

**2B. Evaluate Merged Component**
- Assess if different node types could benefit from `Merged` component
- Performance benefit: "Each type will cost you exactly one draw call"
- Expected improvement: Better performance when mixing different node geometries

**2C. Optimize Instance Grouping**
- Refine node grouping strategy to minimize instance group count
- Balance between visual states and performance

### Phase 3: Testing & Validation ✅ (HIGH PRIORITY)

1. **Functional Testing**
   - Verify dragging works consistently across all story examples
   - Test with small (50), medium (200), and large (1000+) node graphs
   - Ensure feature parity with individual node dragging

2. **Performance Testing**
   - Measure rendering performance before/after optimizations
   - Test drag responsiveness with large graphs
   - Verify no regression in existing functionality

3. **Edge Case Testing**
   - Multi-selection dragging behavior
   - Constraint dragging with cluster bounds
   - Event interaction with other features (selection, context menus)

## 🎯 Expected Outcomes

**Immediate Benefits:**
- ✅ Consistent, reliable node dragging matching individual node behavior
- ✅ Simplified codebase with removal of complex raycasting logic
- ✅ Better maintainability following drei best practices

**Performance Benefits:**
- 🚀 Significant edge rendering optimization with Segments
- 🚀 Potential draw call reduction with optimized instance grouping
- 🚀 Better scalability for very large graphs

**Technical Improvements:**
- 📈 Following drei's recommended patterns
- 📈 More predictable event handling
- 📈 Better separation of concerns

## Implementation Status

- [x] **Phase 1: Fix Dragging Behavior** ✅ **COMPLETE**
  - [x] Removed parent-level event handlers from `<Instances>` component
  - [x] Added individual event handlers to each `<Instance>` component  
  - [x] Implemented per-instance drag binding using individual `useDrag` hooks
  - [x] Removed complex raycasting logic since drei handles targeting automatically
  - [x] Simplified state management for direct instance tracking
  - [x] Created `DraggableInstance` component to properly use React hooks
  - [x] Fixed React hooks violations and TypeScript errors
  - [x] Successful build and lint validation

- [x] **Phase 2: Performance Optimizations** ✅ **COMPLETE** 
- [ ] Phase 3: Testing & Validation

## Phase 1 Technical Summary

**Key Changes Made:**
- **Architectural Fix**: Moved from parent-level event handling with manual raycasting to individual instance event handling
- **React Hooks Compliance**: Created separate `DraggableInstance` component to properly use `useDrag` hooks
- **Event Targeting**: Now relies on drei's built-in event targeting instead of custom raycasting
- **Code Simplification**: Removed ~150 lines of complex raycasting and event management code
- **State Management**: Simplified to direct instance tracking with `draggedNodeId` state

**Expected Behavior Improvement:**
- Consistent and reliable node dragging matching individual node behavior
- No more "wrong node dragging" issues caused by raycasting inaccuracies
- Direct event targeting for click, double-click, context menu, and drag operations
- Proper cursor management for individual instances

The core issue is architectural - we're fighting against the designed patterns instead of working with them. By aligning with drei's intended usage, we'll get both better behavior and better performance.

## Phase 2 Technical Summary

**Key Changes Made:**
- **InstancedEdges Component**: Created new `InstancedEdges` component using drei's `Segments` for edge rendering optimization
- **Auto-switching Logic**: Added intelligent threshold-based switching at 200+ edges (configurable via `instancedEdgeThreshold`)
- **Performance Grouping**: Groups edges by visual state (active, inactive, selected, dragging) to minimize draw calls
- **GraphScene Integration**: Seamlessly integrated with existing GraphScene architecture with new props:
  - `useInstancedEdges`: Force instanced edge rendering (optional)
  - `instancedEdgeThreshold`: Auto-switching threshold (default: 200 edges)
- **Story Updates**: Enhanced performance testing stories with edge rendering comparisons

**Expected Performance Benefits:**
- Significant draw call reduction for graphs with 200+ edges using drei's Segments component
- "Thousands of segments under the same geometry" as per drei documentation
- Better scalability for edge-heavy graphs while maintaining visual state grouping
- Maintains compatibility with existing edge features (themes, selections, dragging states)

**Implementation Highlights:**
- Uses ColorRepresentation for proper Three.js color handling
- Maintains edge offset calculations to prevent overlap with nodes
- Groups edges by visual state to preserve interactive highlighting
- Fallback to traditional rendering for animated graphs or when disabled

**Merged Component Evaluation:**
- Analyzed drei's Merged component for potential node type optimization
- Determined that current Instances approach is more suitable for our use case
- Merged is better for reusing different mesh geometries; Instances is optimal for our visual state grouping
- Current sphere-based instancing with visual state groups provides better performance than mesh reuse

**Instance Grouping Optimizations:**
- **Performance Improvements**: Used Set-based lookups (O(1)) instead of array.includes() (O(n))
- **Size Binning**: Round sizes to nearest 0.5 to reduce number of instance groups
- **Simplified Keys**: Removed non-essential properties from grouping keys to minimize groups
- **Memory Optimization**: Pre-compute threat colors and reuse objects
- **Batch Ordering**: Sort groups by node count (largest first) for better GPU batching
- **Color Handling**: Proper ColorRepresentation type handling for Three.js compatibility