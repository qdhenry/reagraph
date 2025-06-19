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

- [ ] Phase 1: Fix Dragging Behavior
- [ ] Phase 2: Performance Optimizations
- [ ] Phase 3: Testing & Validation

The core issue is architectural - we're fighting against the designed patterns instead of working with them. By aligning with drei's intended usage, we'll get both better behavior and better performance.