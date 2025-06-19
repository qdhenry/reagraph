import React, { FC, useMemo, useRef, useCallback } from 'react';
import { Segments, Segment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3, ColorRepresentation } from 'three';
import { useStore } from '../../store';
import { InternalGraphEdge } from '../../types';
import { getVector } from '../../utils';

export interface InstancedEdgesProps {
  /**
   * Whether the edges should be animated.
   */
  animated?: boolean;

  /**
   * Whether the edges are disabled.
   */
  disabled?: boolean;

  /**
   * The array of edge objects.
   */
  edges: Array<InternalGraphEdge>;

  /**
   * Line width for the segments.
   */
  lineWidth?: number;

  /**
   * Maximum number of edge segments to render.
   */
  limit?: number;
}

interface EdgeSegmentGroup {
  edges: InternalGraphEdge[];
  color: ColorRepresentation;
  opacity: number;
  highlighted: boolean;
}

/**
 * InstancedEdges component using drei's Segments for optimal performance with large graphs.
 * Groups edges by visual state (active, inactive, selected, dragging) and renders them
 * as line segments for significantly better performance than individual edge meshes.
 */
export const InstancedEdges: FC<InstancedEdgesProps> = ({
  animated = true,
  disabled = false,
  edges,
  lineWidth = 1.0,
  limit = 10000
}) => {
  const theme = useStore(state => state.theme);
  const nodes = useStore(state => state.nodes);
  const draggingIds = useStore(state => state.draggingIds);
  const actives = useStore(state => state.actives || []);
  const selections = useStore(state => state.selections || []);
  const hasSelections = selections.length > 0;

  // Create a nodes map for fast lookup
  const nodesMap = useMemo(() => {
    return new Map(nodes.map(node => [node.id, node]));
  }, [nodes]);

  // Group edges by visual state for efficient rendering
  const edgeGroups = useMemo((): EdgeSegmentGroup[] => {
    const groups = new Map<string, EdgeSegmentGroup>();

    edges.forEach(edge => {
      const isActive = actives.includes(edge.id);
      const isSelected = selections.includes(edge.id);
      const isDraggingCurrent =
        draggingIds.includes(edge.source) || draggingIds.includes(edge.target);

      const shouldHighlight = isActive || isSelected || isDraggingCurrent;

      const selectionOpacity = hasSelections
        ? shouldHighlight
          ? theme.edge.selectedOpacity || theme.edge.opacity
          : theme.edge.inactiveOpacity || theme.edge.opacity * 0.3
        : theme.edge.opacity;

      const color = shouldHighlight
        ? theme.edge.activeFill
        : edge.fill || theme.edge.fill;

      // Create grouping key based on visual state
      const groupKey = `${color}-${selectionOpacity}-${shouldHighlight}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          edges: [],
          color,
          opacity: selectionOpacity,
          highlighted: shouldHighlight
        });
      }

      groups.get(groupKey)!.edges.push(edge);
    });

    return Array.from(groups.values());
  }, [edges, actives, selections, draggingIds, hasSelections, theme]);

  // Helper function to get edge positions
  const getEdgePositions = useCallback(
    (edge: InternalGraphEdge) => {
      const sourceNode = nodesMap.get(edge.source);
      const targetNode = nodesMap.get(edge.target);

      if (
        !sourceNode ||
        !targetNode ||
        !sourceNode.position ||
        !targetNode.position
      ) {
        return null;
      }

      const sourceVector = getVector(sourceNode);
      const targetVector = getVector(targetNode);

      // Apply node size offset to prevent lines from going through nodes
      const sourceSize = sourceNode.size || 7;
      const targetSize = targetNode.size || 7;

      // Calculate direction vector and normalize
      const direction = new Vector3()
        .subVectors(targetVector, sourceVector)
        .normalize();

      // Apply offsets
      const start = sourceVector
        .clone()
        .add(direction.clone().multiplyScalar(sourceSize));
      const end = targetVector
        .clone()
        .sub(direction.clone().multiplyScalar(targetSize));

      return {
        start: [start.x, start.y, start.z] as [number, number, number],
        end: [end.x, end.y, end.z] as [number, number, number]
      };
    },
    [nodesMap]
  );

  return (
    <group>
      {edgeGroups.map((group, groupIndex) => (
        <Segments
          key={`edge-group-${groupIndex}-${group.color}`}
          limit={Math.min(group.edges.length, limit)}
          lineWidth={lineWidth}
        >
          <meshBasicMaterial
            color={group.color}
            transparent={true}
            opacity={group.opacity}
            fog={true}
          />

          {group.edges.map(edge => {
            const positions = getEdgePositions(edge);

            if (!positions) {
              return null;
            }

            return (
              <Segment
                key={edge.id}
                start={positions.start}
                end={positions.end}
                color={group.color}
              />
            );
          })}
        </Segments>
      ))}
    </group>
  );
};
