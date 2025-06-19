import React, { FC, useMemo, useRef, useCallback, useEffect } from 'react';
import { a } from '@react-spring/three';
import { Instances, Instance } from '@react-three/drei';
import {
  DoubleSide,
  Color,
  Matrix4,
  Vector3,
  Raycaster,
  Object3D,
  ColorRepresentation
} from 'three';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';

import { useStore } from '../../store';
import {
  InternalGraphNode,
  ContextMenuEvent,
  NodeRenderer,
  CollapseProps
} from '../../types';
import { animationConfig } from '../../utils/animation';
import { useCameraControls } from '../../CameraControls/useCameraControls';
import { useDrag } from '../../utils/useDrag';
import { useHoverIntent } from '../../utils/useHoverIntent';
import { Ring } from '../Ring';

export interface InstancedNodesProps {
  /**
   * Whether the nodes should be animated.
   */
  animated?: boolean;

  /**
   * Whether the nodes are disabled.
   */
  disabled?: boolean;

  /**
   * Whether the nodes are draggable.
   */
  draggable?: boolean;

  /**
   * Constrain dragging to the cluster bounds.
   */
  constrainDragging?: boolean;

  /**
   * The url for the label font.
   */
  labelFontUrl?: string;

  /**
   * The function to use to render the node.
   */
  renderNode?: NodeRenderer;

  /**
   * The context menu for the node.
   */
  contextMenu?: (event: ContextMenuEvent) => React.ReactNode;

  /**
   * Event handlers
   */
  onPointerOver?: (
    node: InternalGraphNode,
    event: ThreeEvent<PointerEvent>
  ) => void;
  onPointerOut?: (
    node: InternalGraphNode,
    event: ThreeEvent<PointerEvent>
  ) => void;
  onClick?: (
    node: InternalGraphNode,
    props?: CollapseProps,
    event?: ThreeEvent<MouseEvent>
  ) => void;
  onDoubleClick?: (
    node: InternalGraphNode,
    event: ThreeEvent<MouseEvent>
  ) => void;
  onContextMenu?: (node?: InternalGraphNode, props?: any) => void;
  onDragged?: (node: InternalGraphNode) => void;
}

interface NodeInstanceGroup {
  nodes: InternalGraphNode[];
  color: ColorRepresentation;
  opacity: number;
  size: number;
  highlighted: boolean;
}

/**
 * InstancedNodes component using drei's Instances for optimal performance with large graphs.
 * Groups nodes by visual state (active, inactive, selected, dragging) similar to the edge optimization pattern.
 */
export const InstancedNodes: FC<InstancedNodesProps> = ({
  animated = true,
  disabled = false,
  draggable = false,
  constrainDragging = false,
  labelFontUrl,
  renderNode,
  contextMenu,
  onPointerOver,
  onPointerOut,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragged
}) => {
  const cameraControls = useCameraControls();
  const theme = useStore(state => state.theme);
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);
  const draggingIds = useStore(state => state.draggingIds);
  const collapsedNodeIds = useStore(state => state.collapsedNodeIds);
  const actives = useStore(state => state.actives || []);
  const selections = useStore(state => state.selections || []);
  const hasSelections = selections.length > 0;
  const center = useStore(state => state.centerPosition);
  const clusters = useStore(state => state.clusters);

  const addDraggingId = useStore(state => state.addDraggingId);
  const removeDraggingId = useStore(state => state.removeDraggingId);
  const setHoveredNodeId = useStore(state => state.setHoveredNodeId);
  const setNodePosition = useStore(state => state.setNodePosition);
  const setCollapsedNodeIds = useStore(state => state.setCollapsedNodeIds);

  const instancesRef = useRef<any>(null);
  const isDragging = draggingIds.length > 0;

  // Group nodes by visual state for efficient rendering
  const nodeGroups = useMemo((): NodeInstanceGroup[] => {
    const groups = new Map<string, NodeInstanceGroup>();

    nodes.forEach(node => {
      const isActive = actives.includes(node.id);
      const isSelected = selections.includes(node.id);
      const isDraggingCurrent = draggingIds.includes(node.id);

      const shouldHighlight = isActive || isSelected || isDraggingCurrent;

      const selectionOpacity = hasSelections
        ? shouldHighlight
          ? theme.node.selectedOpacity
          : theme.node.inactiveOpacity
        : theme.node.opacity;

      const color = shouldHighlight
        ? theme.node.activeFill
        : node.fill || theme.node.fill;

      const size = node.size || 7;

      // Create a unique key for grouping similar visual states
      const groupKey = `${color}-${selectionOpacity}-${size}-${shouldHighlight}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          nodes: [],
          color,
          opacity: selectionOpacity,
          size,
          highlighted: shouldHighlight
        });
      }

      groups.get(groupKey)!.nodes.push(node);
    });

    return Array.from(groups.values());
  }, [nodes, actives, selections, draggingIds, hasSelections, theme]);

  // Handle raycasting for individual node interactions
  const intersect = useCallback(
    (raycaster: Raycaster): InternalGraphNode | null => {
      if (!instancesRef.current || !raycaster.camera) {
        return null;
      }

      // For now, we'll need to implement custom raycasting logic
      // This is a simplified version - in production we'd want more sophisticated intersection testing
      const intersections = raycaster.intersectObject(
        instancesRef.current,
        true
      );

      if (intersections.length > 0) {
        const intersection = intersections[0];
        // Extract node ID from userData or instance index
        const nodeId = intersection.object.userData?.nodeId;
        if (nodeId) {
          return nodes.find(n => n.id === nodeId) || null;
        }
      }

      return null;
    },
    [nodes]
  );

  useFrame(state => {
    if (disabled) return;

    const intersectedNode = intersect(state.raycaster);
    // Handle interactions here - this is a simplified version
    // In production, we'd want more sophisticated event handling
  });

  return (
    <group>
      {nodeGroups.map((group, groupIndex) => {
        const normalizedColor = new Color(group.color);

        return (
          <Instances
            key={`${groupIndex}-${group.color}-${group.size}`}
            ref={instancesRef}
            limit={group.nodes.length}
            range={group.nodes.length}
          >
            <sphereGeometry args={[1, 25, 25]} />
            <a.meshPhongMaterial
              side={DoubleSide}
              transparent={true}
              fog={true}
              opacity={group.opacity}
              color={normalizedColor}
              emissive={normalizedColor}
              emissiveIntensity={0.7}
            />

            {group.nodes.map((node, nodeIndex) => {
              const position = node.position
                ? [
                  node.position.x,
                  node.position.y,
                  group.highlighted ? node.position.z + 1 : node.position.z
                ]
                : center
                  ? [center.x, center.y, 0]
                  : [0, 0, 0];

              return (
                <Instance
                  key={node.id}
                  position={position as [number, number, number]}
                  scale={[group.size, group.size, group.size]}
                  userData={{ nodeId: node.id, type: 'node' }}
                />
              );
            })}
          </Instances>
        );
      })}

      {/* Selection rings - render separately for selected nodes */}
      {selections.map(selectedId => {
        const node = nodes.find(n => n.id === selectedId);
        if (!node || !node.position) return null;

        const size = node.size || 7;
        const position = [
          node.position.x,
          node.position.y,
          node.position.z + 0.1
        ];

        return (
          <group
            key={`ring-${selectedId}`}
            position={position as [number, number, number]}
          >
            <Ring
              opacity={0.5}
              size={size}
              animated={animated}
              color={theme.ring.activeFill}
            />
          </group>
        );
      })}
    </group>
  );
};
