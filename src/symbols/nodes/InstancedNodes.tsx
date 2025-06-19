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
import { useFrame, useThree } from '@react-three/fiber';
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
import { Label } from '../Label';
import { Icon } from './Icon';
import { ThreatIndicator } from './ThreatIndicator';
import { useSpring } from '@react-spring/three';

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
   * Whether to show labels on nodes.
   */
  showLabels?: boolean;

  /**
   * Whether to show icons on nodes.
   */
  showIcons?: boolean;

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
  showLabels = true,
  showIcons = true,
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
  const hoveredNodeRef = useRef<string | null>(null);
  const { raycaster } = useThree();

  // Helper function to get icon URL from iconName
  const getIconUrl = useCallback((iconName: string) => {
    const iconMap: Record<string, string> = {
      java: '/docs/assets/computer.svg',
      dotnet: '/docs/assets/product.svg',
      go: '/docs/assets/demon.svg',
      python: '/docs/assets/fire.svg',
      default: '/docs/assets/user.svg'
    };
    return iconMap[iconName] || iconMap.default;
  }, []);

  // Track node positions for raycasting
  const nodePositions = useMemo(() => {
    const positions = new Map<
      string,
      { x: number; y: number; z: number; size: number }
    >();
    nodes.forEach(node => {
      if (node.position) {
        const size = node.size || 7;
        positions.set(node.id, {
          x: node.position.x,
          y: node.position.y,
          z: node.position.z,
          size
        });
      }
    });
    return positions;
  }, [nodes]);

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

      // Use threat severity color if available, otherwise use theme color
      const threatSeverity = node.data?.severity;
      let color = shouldHighlight
        ? theme.node.activeFill
        : node.fill || theme.node.fill;

      // Override with threat severity colors
      if (threatSeverity && !shouldHighlight) {
        const threatColors: Record<string, string> = {
          critical: '#DC2626',
          high: '#EA580C',
          medium: '#D97706',
          low: '#65A30D'
        };
        color = threatColors[threatSeverity] || color;
      }

      const size = node.size || 7;

      // Include threat severity in grouping key for animation purposes
      const groupKey = `${color}-${selectionOpacity}-${size}-${shouldHighlight}-${threatSeverity || 'none'}`;

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

  // Enhanced raycasting for individual node interactions
  const intersect = useCallback(
    (raycaster: Raycaster): InternalGraphNode | null => {
      if (!raycaster.camera || nodePositions.size === 0) {
        return null;
      }

      // Manual sphere intersection testing for better accuracy
      const cameraPosition = raycaster.ray.origin;
      const rayDirection = raycaster.ray.direction;

      let closestNode: InternalGraphNode | null = null;
      let closestDistance = Infinity;

      for (const [nodeId, position] of nodePositions) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        // Calculate distance from ray to sphere center
        const sphereCenter = new Vector3(position.x, position.y, position.z);
        const toSphere = sphereCenter.clone().sub(cameraPosition);
        const projectionLength = toSphere.dot(rayDirection);

        // Skip if sphere is behind the camera
        if (projectionLength < 0) continue;

        const closestPointOnRay = cameraPosition
          .clone()
          .add(rayDirection.clone().multiplyScalar(projectionLength));
        const distanceToRay = sphereCenter.distanceTo(closestPointOnRay);

        // Check if ray intersects sphere
        const sphereRadius = position.size;
        if (
          distanceToRay <= sphereRadius &&
          projectionLength < closestDistance
        ) {
          closestDistance = projectionLength;
          closestNode = node;
        }
      }

      return closestNode;
    },
    [nodes, nodePositions]
  );

  useFrame(state => {
    if (disabled) return;

    const intersectedNode = intersect(state.raycaster);
    const currentHoveredId = hoveredNodeRef.current;
    const newHoveredId = intersectedNode?.id || null;

    // Handle hover state changes
    if (currentHoveredId !== newHoveredId) {
      // Handle pointer out for previously hovered node
      if (currentHoveredId) {
        const prevNode = nodes.find(n => n.id === currentHoveredId);
        if (prevNode && onPointerOut) {
          // Create a mock event for compatibility
          const mockEvent = {
            nativeEvent: new PointerEvent('pointerout'),
            intersections: [],
            object: { userData: { nodeId: currentHoveredId } }
          } as any;
          onPointerOut(prevNode, mockEvent);
        }
        setHoveredNodeId(null);
      }

      // Handle pointer over for newly hovered node
      if (newHoveredId && intersectedNode) {
        if (onPointerOver) {
          // Create a mock event for compatibility
          const mockEvent = {
            nativeEvent: new PointerEvent('pointerover'),
            intersections: [],
            object: { userData: { nodeId: newHoveredId } }
          } as any;
          onPointerOver(intersectedNode, mockEvent);
        }
        setHoveredNodeId(newHoveredId);
      }

      hoveredNodeRef.current = newHoveredId;
    }
  });

  // Click handler for instances
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (disabled || !onClick) return;

      event.stopPropagation();
      const intersectedNode = intersect(raycaster);

      if (intersectedNode) {
        onClick(intersectedNode, undefined, event);
      }
    },
    [disabled, onClick, intersect, raycaster]
  );

  // Double click handler
  const handleDoubleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (disabled || !onDoubleClick) return;

      event.stopPropagation();
      const intersectedNode = intersect(raycaster);

      if (intersectedNode) {
        onDoubleClick(intersectedNode, event);
      }
    },
    [disabled, onDoubleClick, intersect, raycaster]
  );

  // Context menu handler
  const handleContextMenu = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (disabled || !onContextMenu) return;

      event.stopPropagation();
      const intersectedNode = intersect(raycaster);

      if (intersectedNode) {
        onContextMenu(intersectedNode);
      }
    },
    [disabled, onContextMenu, intersect, raycaster]
  );

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
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
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

      {/* Threat severity indicators - pulsing rings for critical/high threats */}
      {nodes.map(node => {
        const threatSeverity = node.data?.severity;
        if (
          !node.position ||
          !threatSeverity ||
          (threatSeverity !== 'critical' && threatSeverity !== 'high')
        ) {
          return null;
        }

        const size = node.size || 7;
        const position = [
          node.position.x,
          node.position.y,
          node.position.z - 0.5
        ];

        const pulseIntensity = threatSeverity === 'critical' ? 1.5 : 1.2;
        const pulseSpeed = threatSeverity === 'critical' ? 2 : 1.5;

        return (
          <ThreatIndicator
            key={`threat-${node.id}`}
            position={position as [number, number, number]}
            size={size}
            severity={threatSeverity}
            animated={animated}
            pulseIntensity={pulseIntensity}
            pulseSpeed={pulseSpeed}
          />
        );
      })}

      {/* Labels - render separately for all nodes when enabled */}
      {showLabels &&
        nodes.map(node => {
          if (!node.position || !node.label) return null;

          const size = node.size || 7;
          const position = [
            node.position.x,
            node.position.y,
            node.position.z + size + 5
          ];

          return (
            <group
              key={`label-${node.id}`}
              position={position as [number, number, number]}
            >
              <Label
                text={node.label}
                fontUrl={labelFontUrl}
                color={theme.node.label?.color}
                opacity={1}
                fontSize={Math.max(3, size * 0.5)}
              />
            </group>
          );
        })}

      {/* Icons - render separately for all nodes when enabled */}
      {showIcons &&
        nodes.map(node => {
          if (!node.position || !node.data?.iconName) return null;

          const size = node.size || 7;
          const position = [
            node.position.x,
            node.position.y,
            node.position.z + 0.5
          ];

          return (
            <group
              key={`icon-${node.id}`}
              position={position as [number, number, number]}
            >
              <Icon
                id={node.id}
                image={getIconUrl(node.data.iconName)}
                size={size * 1.5}
                opacity={0.9}
                animated={animated}
                color="#FFFFFF"
                node={node}
                active={false}
                selected={false}
              />
            </group>
          );
        })}
    </group>
  );
};
