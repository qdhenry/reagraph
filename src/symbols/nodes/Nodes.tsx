import React, { FC, useMemo } from 'react';
import { useStore } from '../../store';
import { Node, NodeProps } from '../Node';
import { InstancedNodes, InstancedNodesProps } from './InstancedNodes';

export interface NodesProps
  extends Omit<NodeProps, 'id'>,
    Omit<InstancedNodesProps, keyof NodeProps> {
  /**
   * Force the use of instanced rendering regardless of node count.
   * When undefined, auto-switches at 100+ nodes threshold.
   */
  useInstancedNodes?: boolean;

  /**
   * Threshold for auto-switching to instanced rendering.
   * Default: 100 nodes.
   */
  instancedThreshold?: number;

  /**
   * Whether to enable instanced rendering at all.
   * Default: true.
   */
  enableInstancing?: boolean;
}

/**
 * Container component that automatically switches between individual Node components
 * and InstancedNodes based on node count for optimal performance.
 *
 * - Individual nodes: Full feature support, better for small graphs (<100 nodes)
 * - Instanced nodes: Optimized performance, better for large graphs (100+ nodes)
 */
export const Nodes: FC<NodesProps> = ({
  useInstancedNodes,
  instancedThreshold = 100,
  enableInstancing = true,
  animated = true,
  disabled = false,
  draggable = false,
  constrainDragging = false,
  labelFontUrl,
  renderNode,
  contextMenu,
  showLabels = true,
  showIcons = true,
  onPointerOver,
  onPointerOut,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragged,
  ...rest
}) => {
  const nodes = useStore(state => state.nodes);

  // Determine whether to use instanced rendering
  const shouldUseInstanced = useMemo(() => {
    if (!enableInstancing) return false;
    if (useInstancedNodes !== undefined) return useInstancedNodes;

    // Auto-switch based on node count
    return nodes.length >= instancedThreshold;
  }, [enableInstancing, useInstancedNodes, nodes.length, instancedThreshold]);

  // If using custom node renderer, fall back to individual nodes for now
  // TODO: Implement custom renderer support for instanced nodes
  const hasCustomRenderer = !!renderNode;
  const useIndividualNodes = hasCustomRenderer || !shouldUseInstanced;

  if (useIndividualNodes) {
    // Render individual Node components (current implementation)
    return (
      <>
        {nodes.map(node => (
          <Node
            key={node.id}
            id={node.id}
            animated={animated}
            disabled={disabled}
            draggable={draggable}
            constrainDragging={constrainDragging}
            labelFontUrl={labelFontUrl}
            renderNode={renderNode}
            contextMenu={contextMenu}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            onDragged={onDragged}
            {...rest}
          />
        ))}
      </>
    );
  }

  // Render instanced nodes for performance
  return (
    <InstancedNodes
      animated={animated}
      disabled={disabled}
      draggable={draggable}
      constrainDragging={constrainDragging}
      labelFontUrl={labelFontUrl}
      renderNode={renderNode}
      contextMenu={contextMenu}
      showLabels={showLabels}
      showIcons={showIcons}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onDragged={onDragged}
    />
  );
};
