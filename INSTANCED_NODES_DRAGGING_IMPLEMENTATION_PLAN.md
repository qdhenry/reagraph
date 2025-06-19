# InstancedNodes Dragging Implementation Plan

## Problem Analysis

### Current State
The `InstancedNodes` component in `src/symbols/nodes/InstancedNodes.tsx:45` accepts a `draggable` prop but **doesn't implement any dragging functionality**. While individual `Node` components use `useDrag` (line 222-237 in `Node.tsx`), the instanced version lacks this implementation entirely.

### Root Cause
1. **Missing Implementation**: `InstancedNodes` imports `useDrag` but never uses it
2. **Instanced Rendering Challenge**: drei's `Instances` component groups nodes by visual state, making individual event handling complex
3. **Raycasting Gap**: Current `intersect` method (lines 206-231) is incomplete and not used for drag events

### Research Findings
- **three-forcegraph**: No specific instanced node dragging implementation found
- **React Three Fiber Community**: Dragging individual instances is possible but requires custom raycasting and matrix management
- **Performance Trade-offs**: Adds computational overhead but preserves rendering benefits

## Feasibility Assessment

### ✅ **YES, It's Possible!**

From research on React Three Fiber patterns, dragging individual instances **is definitely possible** but requires:

1. **Custom Raycasting**: Manual implementation to identify which instance was clicked
2. **Instance Matrix Management**: Direct manipulation of transformation matrices
3. **Event Integration**: Custom pointer event handling with the existing `useDrag` hook

### Trade-offs
- **Performance**: Adds computational overhead for raycasting
- **Complexity**: More complex than individual nodes but preserves rendering benefits
- **Feature Parity**: May need simplified drag behavior vs individual nodes

## Implementation Plan

### **Phase 1: Enhanced Raycasting for Instance Detection** ✅ (PARTIALLY COMPLETE)

**Status**: The enhanced raycasting has been implemented in the current code:
- ✅ Improved `intersect` method with proper sphere intersection testing
- ✅ Instance event handlers for click, double-click, and context menu
- ✅ Hover state management with `useFrame` integration

**Remaining Work:**
- [ ] Optimize raycasting performance for large node counts
- [ ] Add debugging tools for raycasting accuracy

### **Phase 2: Dragging Implementation** 🚧 (NOT YET IMPLEMENTED)

1. **Integrate `useDrag` Hook**
   - [ ] Adapt existing `useDrag` utility to work with instance-specific position updates
   - [ ] Handle drag start/end events for individual instances
   - [ ] Update node positions in the store while maintaining instanced rendering

2. **Matrix Management**
   - [ ] Direct manipulation of instance transformation matrices during drag
   - [ ] Sync matrix updates with the node position store
   - [ ] Maintain visual grouping while allowing individual manipulation

**Key Implementation Details:**
```typescript
// Add drag state management
const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

// Create drag handlers for each instance
const handleDragStart = useCallback((nodeId: string, event: ThreeEvent<PointerEvent>) => {
  if (!draggable) return;
  setDraggedNodeId(nodeId);
  addDraggingId(nodeId);
}, [draggable, addDraggingId]);

// Integrate with useDrag hook
const bind = useDrag({
  draggable: draggable && !!draggedNodeId,
  position: draggedNodeId ? nodes.find(n => n.id === draggedNodeId)?.position : null,
  set: (pos) => {
    if (draggedNodeId) {
      setNodePosition(draggedNodeId, pos);
    }
  },
  onDragStart: () => {},
  onDragEnd: () => {
    if (draggedNodeId) {
      removeDraggingId(draggedNodeId);
      const node = nodes.find(n => n.id === draggedNodeId);
      if (node) onDragged?.(node);
      setDraggedNodeId(null);
    }
  }
});
```

### **Phase 3: Event Integration** 🚧 (NOT YET IMPLEMENTED)

1. **Cursor Management**
   - [ ] Add `useCursor` hooks for drag states (grab/grabbing)
   - [ ] Implement hover states for individual instances

2. **Store Integration**
   - [ ] Connect dragging events to existing `addDraggingId`/`removeDraggingId` store actions
   - [ ] Ensure compatibility with selection, highlighting, and other features

### **Phase 4: Testing & Optimization** 🚧 (NOT YET IMPLEMENTED)

1. **Performance Testing**
   - [ ] Verify drag performance with large graphs (1000+ nodes)
   - [ ] Measure impact vs individual node rendering
   - [ ] Update performance stories to demonstrate working drag

2. **Feature Parity**
   - [ ] Ensure `onDragged`, `constrainDragging` props work
   - [ ] Test with context menus, selection, and other interactions

## Technical Implementation Details

### Current Architecture Advantages
- Enhanced raycasting system already in place
- Event handlers (click, double-click, context menu) working
- Hover state management functional
- Node position tracking implemented

### Required Changes

1. **Add Drag State Management**
   ```typescript
   const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
   const [dragStartPosition, setDragStartPosition] = useState<Vector3 | null>(null);
   ```

2. **Extend Event Handlers**
   ```typescript
   const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
     if (!draggable) return;
     const intersectedNode = intersect(raycaster);
     if (intersectedNode) {
       setDraggedNodeId(intersectedNode.id);
       // Initialize drag operation
     }
   }, [draggable, intersect, raycaster]);
   ```

3. **Integrate useDrag Hook**
   - Adapt existing `useDrag` utility for instanced nodes
   - Handle position updates during drag operations
   - Sync with store state management

### Performance Considerations
- Raycasting overhead minimal compared to rendering benefits
- Drag operations only active during user interaction
- Instance grouping maintained for optimal GPU performance

## Success Criteria

- [ ] Individual nodes in InstancedNodes can be dragged
- [ ] Drag performance acceptable for 1000+ node graphs
- [ ] Feature parity with individual Node dragging
- [ ] No regression in rendering performance
- [ ] All existing event handlers continue to work
- [ ] Story examples demonstrate functionality

## Risk Mitigation

1. **Performance Risk**: Monitor frame rates during drag operations
2. **Complexity Risk**: Implement incrementally with fallback to individual nodes
3. **Compatibility Risk**: Ensure existing features continue working

## Conclusion

The implementation will maintain the performance benefits of instanced rendering while adding full drag support. The key insight is using custom raycasting to bridge the gap between drei's `Instances` component and individual node interactions.

**Current Status**: Phase 1 is largely complete with enhanced raycasting and event handling. Phase 2 (actual dragging) is the next critical step to implement full functionality.